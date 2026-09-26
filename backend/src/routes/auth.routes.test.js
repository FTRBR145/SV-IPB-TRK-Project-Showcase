import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import { createMemoryRepository } from '../repositories/memoryRepository.js';

test('cookie session restores through /auth/me and logout clears it', async () => {
  const browser = request.agent(createApp({ repository: createMemoryRepository() }));
  const login = await browser
    .post(env.apiPrefix + '/auth/login')
    .send({ identifier: env.studentEmail, password: env.studentPassword })
    .expect(200);
  const sessionCookie = login.headers['set-cookie']?.find(cookie =>
    cookie.startsWith(`${env.cookieName}=`)
  );
  assert.equal(login.body.data.accessToken, undefined);
  assert.deepEqual(Object.keys(login.body.data), ['user']);
  assert.match(sessionCookie, /HttpOnly/);
  assert.match(sessionCookie, /SameSite=Lax/);

  const restored = await browser.get(env.apiPrefix + '/auth/me').expect(200);
  assert.equal(restored.body.data.role, 'student');

  const logout = await browser.post(env.apiPrefix + '/auth/logout').expect(200);
  assert.ok(logout.headers['set-cookie']?.some(cookie =>
    cookie.startsWith(`${env.cookieName}=`) && /Expires=Thu, 01 Jan 1970/.test(cookie)
  ));
  const anonymous = await browser.get(env.apiPrefix + '/auth/me').expect(200);
  assert.equal(anonymous.body.data, null);
});

test('invalid session token still returns 401', async () => {
  const response = await request(createApp({ repository: createMemoryRepository() }))
    .get(env.apiPrefix + '/auth/me')
    .set('Cookie', `${env.cookieName}=not-a-jwt`)
    .expect(401);
  assert.equal(response.body.error.code, 'INVALID_TOKEN');
});

test('logout clears an invalid cookie instead of trapping the browser in a broken session', async () => {
  const response = await request(createApp({ repository: createMemoryRepository() }))
    .post(env.apiPrefix + '/auth/logout')
    .set('Cookie', `${env.cookieName}=not-a-jwt`)
    .expect(200);

  assert.ok(response.headers['set-cookie']?.some(cookie =>
    cookie.startsWith(`${env.cookieName}=`) && /Expires=Thu, 01 Jan 1970/.test(cookie)
  ));
  assert.equal(response.headers['cache-control'], 'no-store');
});

test('login limiter counts failures, resets the account bucket on success, and returns Retry-After', async () => {
  const browser = request.agent(createApp({
    repository: createMemoryRepository(),
    loginLimiter: loginRateLimit({ max: 2, maxPerIp: 10, windowMs: 60_000 })
  }));
  const loginPath = env.apiPrefix + '/auth/login';
  const wrongCredentials = { identifier: env.studentEmail, password: 'incorrect-password' };

  await browser.post(loginPath).send(wrongCredentials).expect(401);
  await browser.post(loginPath).send({ identifier: env.studentEmail, password: env.studentPassword }).expect(200);
  await browser.post(env.apiPrefix + '/auth/logout').expect(200);
  await browser.post(loginPath).send(wrongCredentials).expect(401);
  await browser.post(loginPath).send(wrongCredentials).expect(401);
  const limited = await browser.post(loginPath).send(wrongCredentials).expect(429);

  assert.equal(limited.body.error.code, 'LOGIN_RATE_LIMITED');
  assert.equal(limited.headers['retry-after'], '60');
});
