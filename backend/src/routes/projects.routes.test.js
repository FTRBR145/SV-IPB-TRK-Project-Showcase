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

test('student manages only owned approved projects and admin hide cannot be overridden', async () => {
  const repository = createMemoryRepository(createSeedData());
  const app = createApp({ repository });
  const admin = request.agent(app);
  const owner = request.agent(app);
  const path = env.apiPrefix + '/projects/2';
  await admin.post(env.apiPrefix + '/auth/login').send({ identifier: env.adminEmail, password: env.adminPassword }).expect(200);
  await owner.post(env.apiPrefix + '/auth/login').send({ identifier: env.studentEmail, password: env.studentPassword }).expect(200);

  await request(app).patch(path).send({ title: 'Tanpa sesi' }).expect(401);
  await request(app).delete(path).expect(401);
  await owner.patch(env.apiPrefix + '/projects/1').send({ title: 'Bukan milik saya' }).expect(404);
  await owner.delete(env.apiPrefix + '/projects/1').expect(404);
  await owner.patch(path).send({ nim: 'FAKE', student: 'Pengguna Lain', approvedBy: 'FAKE', isPublished: false }).expect(422);

  const changed = (await owner.patch(path).send({ title: 'Judul baru mahasiswa', description: 'Deskripsi baru yang valid.' }).expect(200)).body.data;
  assert.equal(changed.nim, 'J0304211015');
  assert.equal(changed.student, 'Nabila Putri Utami');
  assert.equal((await request(app).get(path).expect(200)).body.data.title, 'Judul baru mahasiswa');
  const log = (await admin.get(env.apiPrefix + '/activity-logs').expect(200)).body.data.find(item => item.projectId === 2);
  assert.deepEqual(log.changes.title, { before: 'Aplikasi Mobile Smart Home & Monitoring Energi', after: 'Judul baru mahasiswa' });
  assert.equal(log.actorRole, 'student');
  await owner.get(env.apiPrefix + '/activity-logs').expect(403);

  assert.equal((await owner.patch(path).send({ isPublished: false }).expect(200)).body.data.publicationLockedByAdmin, false);
  await request(app).get(path).expect(404);
  assert.equal((await request(app).get(env.apiPrefix + '/statistics').expect(200)).body.data.projects, 1);
  await owner.patch(path).send({ isPublished: true }).expect(200);
  await request(app).get(path).expect(200);

  const hidden = (await admin.patch(path).send({ isPublished: false, publicationReason: 'Tautan video belum sesuai.' }).expect(200)).body.data;
  assert.equal(hidden.publicationLockedByAdmin, true);
  assert.equal(hidden.publicationReason, 'Tautan video belum sesuai.');
  assert.equal((await owner.patch(path).send({ isPublished: true }).expect(409)).body.error.code, 'PUBLICATION_LOCKED');
  await owner.patch(path).send({ publicationReason: 'Alasan palsu' }).expect(422);
  await owner.patch(path).send({ title: 'Diedit saat disembunyikan admin' }).expect(200);
  await request(app).get(path).expect(404);
  assert.equal((await owner.get(env.apiPrefix + '/projects?scope=mine').expect(200)).body.data[0].title, 'Diedit saat disembunyikan admin');
  await owner.delete(path).expect(200);
  await admin.get(path).expect(404);
});

test('legacy hidden project is treated as hidden by admin', async () => {
  const seed = createSeedData();
  seed.projects[1].isPublished = false;
  const app = createApp({ repository: createMemoryRepository(seed) });
  const owner = request.agent(app);
  await owner.post(env.apiPrefix + '/auth/login').send({ identifier: env.studentEmail, password: env.studentPassword }).expect(200);
  await owner.patch(env.apiPrefix + '/projects/2').send({ isPublished: true }).expect(409);
});
