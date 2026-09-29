import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { createMemoryRepository } from '../repositories/memoryRepository.js';

test('API rejects unsafe video URLs before saving them', async () => {
  const app = createApp({ repository: createMemoryRepository() });
  const project = {
    title: 'Projek uji keamanan', course: 'APLIKASI MOBILE', semester: 3,
    description: 'Deskripsi projek untuk pengujian keamanan.',
    videoUrl: 'https://evil.invalid/?next=youtube.com/embed/abcdefghijk'
  };
  await request(app).post(env.apiPrefix + '/projects').send(project).expect(422);
  await request(app).post(env.apiPrefix + '/projects')
    .send({ ...project, videoUrl: 'https://youtu.be/abcdefghijk' }).expect(401);
});

test('unsafe requests reject foreign origins even with a valid session', async () => {
  const browser = request.agent(createApp({ repository: createMemoryRepository() }));
  await browser.post(env.apiPrefix + '/auth/login')
    .send({ identifier: env.studentEmail, password: env.studentPassword }).expect(200);
  const rejected = await browser.post(env.apiPrefix + '/auth/logout')
    .set('Origin', 'https://attacker.invalid').expect(403);
  assert.equal(rejected.body.error.code, 'INVALID_ORIGIN');
  assert.equal((await browser.get(env.apiPrefix + '/auth/me').expect(200)).body.data.role, 'student');
  const sameSite = await browser.post(env.apiPrefix + '/auth/logout')
    .set('Sec-Fetch-Site', 'same-site').expect(403);
  assert.equal(sameSite.body.error.code, 'INVALID_ORIGIN');
  await browser.post(env.apiPrefix + '/auth/logout')
    .set('Origin', env.frontendOrigins[0]).expect(200);
});

test('authenticated API responses cannot be cached', async () => {
  const browser = request.agent(createApp({ repository: createMemoryRepository() }));
  await browser.post(env.apiPrefix + '/auth/login')
    .send({ identifier: env.studentEmail, password: env.studentPassword }).expect(200);
  const response = await browser.get(env.apiPrefix + '/submissions/mine').expect(200);
  assert.equal(response.headers['cache-control'], 'no-store');
});
