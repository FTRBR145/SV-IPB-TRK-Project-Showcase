import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const parsedPort = Number.parseInt(process.env.PORT || '3000', 10);

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error('PORT harus berupa angka antara 1 dan 65535.');
}

const jwtSecret = process.env.JWT_SECRET || 'development-only-secret-change-before-production';
const cookieMaxAgeMs = Number.parseInt(process.env.AUTH_COOKIE_MAX_AGE_MS || String(8 * 60 * 60 * 1000), 10);

if (process.env.NODE_ENV === 'production' && (jwtSecret === 'development-only-secret-change-before-production' || jwtSecret.length < 32)) {
  throw new Error('JWT_SECRET production wajib diisi dan memiliki minimal 32 karakter.');
}

if (!Number.isInteger(cookieMaxAgeMs) || cookieMaxAgeMs < 1) {
  throw new Error('AUTH_COOKIE_MAX_AGE_MS wajib berupa angka positif.');
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseCaFile: process.env.DATABASE_CA_FILE || '',
  repository: process.env.REPOSITORY || 'postgres',
  port: parsedPort,
  apiPrefix: process.env.API_PREFIX || '/api',
  frontendOrigins: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: process.env.AUTH_COOKIE_NAME || (process.env.NODE_ENV === 'production' ? '__Host-trk_session' : 'trk_session'),
  cookieMaxAgeMs,
  adminEmail: process.env.ADMIN_EMAIL || 'admin.trk@apps.ipb.ac.id',
  adminPassword: process.env.ADMIN_PASSWORD || 'AdminTRK123!',
  studentEmail: process.env.STUDENT_EMAIL || 'nabila.putri@apps.ipb.ac.id',
  studentPassword: process.env.STUDENT_PASSWORD || 'MahasiswaTRK123!'
});
