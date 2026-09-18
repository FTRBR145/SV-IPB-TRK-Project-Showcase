import { createApp } from './app.js';
import { env } from './config/env.js';
import { createPostgresPool } from './config/postgres.js';
import { createPostgresRepository } from './repositories/postgresRepository.js';
import { createMemoryRepository } from './repositories/memoryRepository.js';

if (!['postgres', 'memory'].includes(env.repository)) throw new Error('REPOSITORY harus postgres atau memory.');
if (env.repository === 'memory' && env.nodeEnv === 'production') throw new Error('Mode memory tidak boleh digunakan di production.');
const repository = env.repository === 'memory'
  ? createMemoryRepository()
  : createPostgresRepository(createPostgresPool());
if (env.repository === 'memory') console.warn('MODE DEMO MEMORY: data tidak permanen.');
// Keep the local fail-fast check, but do not make every serverless cold start
// reserve a database connection before it can accept a request.
else if (env.nodeEnv !== 'production') await repository.getSettings();
const app = createApp({ repository });
const server = app.listen(env.port, () => {
  console.log(`Showcase TRK API berjalan di http://localhost:${env.port}${env.apiPrefix}`);
});

function shutdown(signal) {
  console.log(`${signal} diterima. Menutup server...`);
  server.close(async () => { await repository.close?.(); process.exit(0); });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
