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
