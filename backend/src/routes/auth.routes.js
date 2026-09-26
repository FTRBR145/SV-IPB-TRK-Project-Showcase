import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authenticate, bestEffortAuthenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, profileSchema, passwordSchema } from '../schemas/index.js';
import { ApiError, sendData } from '../utils/http.js';

const router = Router();

function publicUser(user) {
  const { passwordHash: _passwordHash, authVersion: _authVersion, ...safeUser } = user;
  return safeUser;
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: env.cookieMaxAgeMs
  };
}

router.post('/login', validate(loginSchema), async (request, response) => {
  const identifier = request.body.identifier || request.body.email;
  const user = await request.app.locals.repository.findUserByIdentifier(identifier);
  const validPassword = user ? await bcrypt.compare(request.body.password, user.passwordHash) : false;
  if (!user || !validPassword) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email atau password salah.');
  }

  const accessToken = jwt.sign(
    { role: user.role, email: user.email, authVersion: user.authVersion || 0 },
    env.jwtSecret,
    { subject: String(user.id), expiresIn: env.jwtExpiresIn }
  );
  response.cookie(env.cookieName, accessToken, sessionCookieOptions());

  if (user.role === 'admin') {
    await request.app.locals.repository.recordActivity('Admin berhasil login.', 'login', user);
  }
  response.set('Cache-Control', 'no-store');
  sendData(response, { user: publicUser(user) });
});

router.post('/logout', bestEffortAuthenticate, async (request, response) => {
  if (request.user?.role === 'admin') {
    await request.app.locals.repository.recordActivity('Admin logout.', 'logout', request.user);
  }
  const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions();
  response.clearCookie(env.cookieName, clearOptions);
  response.set('Cache-Control', 'no-store');
  sendData(response, { loggedOut: true });
});

router.get('/me', authenticate, async (request, response) => {
  response.set('Cache-Control', 'no-store');
  const user = await request.app.locals.repository.findUserById(request.user.id);
  sendData(response, publicUser(user));
});

router.patch('/me', authenticate, validate(profileSchema), async (request, response) => {
  const user = await request.app.locals.repository.updateOwnProfile(request.user.id, request.body.name, request.user);
  response.set('Cache-Control', 'no-store');
  sendData(response, publicUser(user));
});

router.post('/password', authenticate, validate(passwordSchema), async (request, response) => {
  const repository = request.app.locals.repository;
  const user = await repository.findUserById(request.user.id);
  if (!await bcrypt.compare(request.body.currentPassword, user.passwordHash)) {
    throw new ApiError(400, 'WRONG_PASSWORD', 'Password saat ini tidak sesuai.');
  }
  if (await bcrypt.compare(request.body.newPassword, user.passwordHash)) {
    throw new ApiError(400, 'UNCHANGED_PASSWORD', 'Password baru harus berbeda dari password saat ini.');
  }
  const updated = await repository.changeOwnPassword(user.id, user.passwordHash, await bcrypt.hash(request.body.newPassword, 12), request.user);
  if (!updated) throw new ApiError(409, 'ACCOUNT_CHANGED', 'Akun telah berubah. Silakan masuk kembali.');
  response.set('Cache-Control', 'no-store');
  sendData(response, { changed: true });
});

export default router;
