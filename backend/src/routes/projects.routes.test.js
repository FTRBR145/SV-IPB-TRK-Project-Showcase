import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { createSeedData } from '../data/seed.js';
import { createMemoryRepository } from '../repositories/memoryRepository.js';

test('hidden projects stay private to their student owner and admins', async () => {
  const app = createApp({ repository: createMemoryRepository(createSeedData()) });
  const admin = request.agent(app);
  const owner = request.agent(app);
  await admin.post(env.apiPrefix + '/auth/login').send({ identifier: env.adminEmail, password: env.adminPassword }).expect(200);
  await owner.post(env.apiPrefix + '/auth/login').send({ identifier: env.studentEmail, password: env.studentPassword }).expect(200);

  const changed = await admin.patch(env.apiPrefix + '/projects/2').send({ isPublished: false }).expect(200);
  assert.equal(changed.body.data.isPublished, false);
  const publicList = await request(app).get(env.apiPrefix + '/projects?limit=1').expect(200);
  assert.equal(publicList.body.meta.total, 1);
  assert.equal(publicList.body.data[0].id, 1);
  await request(app).get(env.apiPrefix + '/projects/2').expect(404);
  assert.equal((await request(app).get(env.apiPrefix + '/statistics').expect(200)).body.data.projects, 1);
  await request(app).get(env.apiPrefix + '/projects?scope=all').expect(403);
  await request(app).get(env.apiPrefix + '/projects?scope=mine').expect(403);
  await owner.get(env.apiPrefix + '/projects?scope=all').expect(403);
  assert.deepEqual((await owner.get(env.apiPrefix + '/projects?scope=mine').expect(200)).body.data.map(item => item.id), [2]);
  assert.equal((await owner.get(env.apiPrefix + '/projects/2').expect(200)).body.data.isPublished, false);
  assert.equal((await admin.get(env.apiPrefix + '/projects?scope=all').expect(200)).body.meta.total, 2);
  assert.equal((await admin.get(env.apiPrefix + '/projects/2').expect(200)).body.data.id, 2);

  await admin.patch(env.apiPrefix + '/projects/1').send({ isPublished: false }).expect(200);
  await owner.get(env.apiPrefix + '/projects/1').expect(404);
  await admin.patch(env.apiPrefix + '/projects/2').send({ isPublished: true }).expect(200);
  assert.equal((await request(app).get(env.apiPrefix + '/projects/2').expect(200)).body.data.isPublished, true);
});

test('legacy projects without a publication flag remain public', async () => {
  const app = createApp({ repository: createMemoryRepository(createSeedData()) });
  const response = await request(app).get(env.apiPrefix + '/projects').expect(200);
  assert.equal(response.body.meta.total, 2);
  assert.equal((await request(app).get(env.apiPrefix + '/projects/1').expect(200)).body.data.id, 1);
});
