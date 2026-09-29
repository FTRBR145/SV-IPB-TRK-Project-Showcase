import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { createSeedData } from '../data/seed.js';
import { createMemoryRepository } from '../repositories/memoryRepository.js';

function studentSubmission(overrides = {}) {
  return {
    id: 102,
    title: 'Pengajuan Mahasiswa',
    student: 'Nabila Putri Utami',
    nim: 'J0304211015',
    course: 'APLIKASI MOBILE',
    category: 'Aplikasi Mobile',
    semester: 5,
    description: 'Deskripsi pengajuan mahasiswa yang valid.',
    techStack: ['Flutter'],
    videoUrl: 'https://www.youtube.com/embed/ysz5S6PUM-U',
    status: 'pending',
    createdAt: '2026-09-22T00:00:00.000Z',
    moderatedAt: null,
    ...overrides
  };
}

async function loggedInStudent(seed) {
  const browser = request.agent(createApp({ repository: createMemoryRepository(seed) }));
  await browser.post(env.apiPrefix + '/auth/login')
    .send({ identifier: env.studentEmail, password: env.studentPassword })
    .expect(200);
  return browser;
}

test('approval records the admin on the submission and published project', async () => {
  const seed = createSeedData();
  seed.submissions.unshift(studentSubmission());
  const app = createApp({ repository: createMemoryRepository(seed) });
  const admin = request.agent(app);
  const student = request.agent(app);
  await admin.post(env.apiPrefix + '/auth/login')
    .send({ identifier: env.adminEmail, password: env.adminPassword }).expect(200);
  await student.post(env.apiPrefix + '/auth/login')
    .send({ identifier: env.studentEmail, password: env.studentPassword }).expect(200);

  const { submission, project } = (await admin.post(env.apiPrefix + '/submissions/102/approve').expect(200)).body.data;
  assert.equal(submission.approvedBy, seed.users[0].name);
  assert.equal(submission.approvedById, seed.users[0].id);
  assert.equal(project.approvedBy, submission.approvedBy);
  assert.equal(project.approvedById, submission.approvedById);
  assert.equal(project.approvedAt, submission.moderatedAt);
  assert.equal((await student.get(env.apiPrefix + '/submissions/mine').expect(200)).body.data.find(item => item.id === 102).approvedBy, seed.users[0].name);
  assert.equal((await request(app).get(env.apiPrefix + `/projects/${project.id}`).expect(200)).body.data.approvedBy, seed.users[0].name);
});

test('student can edit only their own pending submission without changing ownership', async () => {
  const seed = createSeedData();
  seed.submissions.unshift(studentSubmission());
  const browser = await loggedInStudent(seed);

  const updated = await browser.patch(env.apiPrefix + '/submissions/102')
    .send({ title: 'Judul Pengajuan Diperbarui', semester: 6, student: 'Pengguna Lain', nim: 'LAIN' })
    .expect(200);

  assert.equal(updated.body.data.title, 'Judul Pengajuan Diperbarui');
  assert.equal(updated.body.data.semester, 6);
  assert.equal(updated.body.data.student, 'Nabila Putri Utami');
  assert.equal(updated.body.data.nim, 'J0304211015');
  assert.equal(updated.body.data.status, 'pending');
});

test('student cannot edit another student submission or a moderated submission', async () => {
  const seed = createSeedData();
  seed.submissions.unshift(studentSubmission({ id: 102, nim: 'J0304211999' }));
  seed.submissions.unshift(studentSubmission({ id: 103, status: 'approved' }));
  const browser = await loggedInStudent(seed);

  await browser.patch(env.apiPrefix + '/submissions/102')
    .send({ title: 'Tidak Boleh Berubah' })
    .expect(404);
  const moderated = await browser.patch(env.apiPrefix + '/submissions/103')
    .send({ title: 'Tidak Boleh Berubah' })
    .expect(409);

  assert.equal(moderated.body.error.code, 'INVALID_SUBMISSION_STATUS');
});

test('student cancels only their own pending submission', async () => {
  const seed = createSeedData();
  seed.submissions.unshift(studentSubmission({ id: 102 }));
  seed.submissions.unshift(studentSubmission({ id: 103, nim: 'OTHER' }));
  seed.submissions.unshift(studentSubmission({ id: 104, status: 'approved' }));
  const app = createApp({ repository: createMemoryRepository(seed) });
  const student = request.agent(app);
  const admin = request.agent(app);
  await student.post(env.apiPrefix + '/auth/login').send({ identifier: env.studentEmail, password: env.studentPassword }).expect(200);
  await admin.post(env.apiPrefix + '/auth/login').send({ identifier: env.adminEmail, password: env.adminPassword }).expect(200);
  await request(app).delete(env.apiPrefix + '/submissions/102').expect(401);
  await admin.delete(env.apiPrefix + '/submissions/102').expect(403);
  await student.delete(env.apiPrefix + '/submissions/103').expect(404);
  await student.delete(env.apiPrefix + '/submissions/104').expect(409);
  await student.delete(env.apiPrefix + '/submissions/102').expect(200);
  await student.delete(env.apiPrefix + '/submissions/102').expect(404);
  assert.equal((await student.get(env.apiPrefix + '/submissions/mine').expect(200)).body.data.some(item => item.id === 102), false);
});
