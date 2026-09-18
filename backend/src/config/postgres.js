import pg from 'pg';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

export function createPostgresPool() {
  if (!env.databaseUrl) throw new Error('DATABASE_URL wajib diisi di backend/.env untuk Supabase/Postgres.');
  const url = new URL(env.databaseUrl);
  if (env.databaseCaFile) {
    // pg lets URL SSL parameters replace the explicit ssl object (including CA).
    for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) url.searchParams.delete(key);
  }
  const pool = new pg.Pool({
    connectionString: url.toString(),
    max: 5,
    min: 1,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    statement_timeout: 15000,
    // Never disable TLS certificate verification for a remote database.
    ...(env.databaseCaFile ? { ssl: {
      ca: readFileSync(
        (() => {
          const configuredPath = resolve(fileURLToPath(new URL('../../', import.meta.url)), env.databaseCaFile);
          const bundledPath = fileURLToPath(new URL('./supabase-ca.crt', import.meta.url));
          return existsSync(configuredPath) ? configuredPath : bundledPath;
        })(),
        'utf8'
      ),
      rejectUnauthorized: true
    } } : {})
  });
  // pg removes disconnected idle clients itself; handle the event so a brief
  // network interruption does not terminate the entire API process.
  pool.on('error', () => console.warn('Koneksi database idle terputus; pool akan membuka koneksi pengganti saat diperlukan.'));
  return pool;
}
