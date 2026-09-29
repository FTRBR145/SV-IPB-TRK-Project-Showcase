import test from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { createPostgresRepository } from './postgresRepository.js';

test('Postgres visibility filtering and public count work with legacy JSONB rows', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema showcase;
      create table showcase.projects (id bigint generated always as identity primary key, data jsonb not null);
      create table showcase.users (id bigint generated always as identity primary key, data jsonb not null);
      create table showcase.courses (id bigint generated always as identity primary key, data jsonb not null);
      create table showcase.moderators (id bigint generated always as identity primary key, data jsonb not null);
      create table showcase.activity_logs (id bigint generated always as identity primary key, data jsonb not null);`);
    await db.query('insert into showcase.projects(data) values ($1::jsonb), ($2::jsonb), ($3::jsonb)', [
      JSON.stringify({ title: 'Lama', nim: 'A1' }),
      JSON.stringify({ title: 'Disembunyikan', nim: 'B2', isPublished: false }),
      JSON.stringify({ title: 'Tayang', nim: 'B2', isPublished: true })
    ]);
    const pool = {
      query: (sql, params = []) => db.query(sql, params.map(value => typeof value === 'object' && value !== null ? JSON.stringify(value) : value)),
      connect: async () => ({
        query: (sql, params = []) => db.query(sql, params.map(value => typeof value === 'object' && value !== null ? JSON.stringify(value) : value)),
        release() {}
      })
    };
    const repository = createPostgresRepository(pool);
    assert.equal((await repository.listProjects()).total, 2);
    assert.deepEqual((await repository.listProjects({ scope: 'all' })).items.map(item => item.id), [3, 2, 1]);
    assert.deepEqual((await repository.listProjects({ scope: 'mine', nim: 'B2' })).items.map(item => item.id), [3, 2]);
    assert.equal((await repository.listProjects({ page: 2, limit: 1 })).items[0].id, 1);
    assert.equal((await repository.getPublicStatistics()).projects, 2);
    await repository.updateProject(1, { isPublished: false }, 'Admin');
    assert.equal((await repository.listProjects()).total, 1);
    assert.equal((await repository.getPublicStatistics()).projects, 1);
  } finally {
    await db.close();
  }
});

test('Postgres owner changes, admin lock, audit diff, and pending cancellation are atomic', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema showcase;
      create table showcase.projects (id bigint generated always as identity primary key, data jsonb not null);
      create table showcase.submissions (id bigint generated always as identity primary key, data jsonb not null, project_id bigint references showcase.projects(id) on delete set null);
      create table showcase.activity_logs (id bigint generated always as identity primary key, data jsonb not null);`);
    let tail = Promise.resolve();
    const connect = async () => {
      const previous = tail;
      let release;
      tail = new Promise(resolve => { release = resolve; });
      await previous;
      return { query: (sql, params = []) => db.query(sql, params.map(value => typeof value === 'object' && value !== null ? JSON.stringify(value) : value)), release };
    };
    const pool = {
      connect,
      async query(sql, params) {
        const client = await connect();
        try { return await client.query(sql, params); }
        finally { client.release(); }
      }
    };
    const repository = createPostgresRepository(pool);
    const owner = { id: 2, role: 'student', nim: 'B2', name: 'Pemilik', email: 'owner@example.test' };
    const admin = { id: 1, role: 'admin', name: 'Admin', email: 'admin@example.test' };
    const owned = await repository.createProject({ title: 'Projek awal', nim: 'B2' }, admin);
    const foreign = await repository.createProject({ title: 'Projek lain', nim: 'C3' }, admin);
    assert.equal(await repository.updateProject(foreign.id, { title: 'Bajakan' }, owner), null);
    assert.equal(await repository.deleteProject(foreign.id, owner), null);
    await repository.updateProject(owned.id, { title: 'Projek diperbaiki' }, owner);
    const editLog = (await repository.getActivityLogs()).find(log => log.projectId === owned.id);
    assert.deepEqual(editLog.changes.title, { before: 'Projek awal', after: 'Projek diperbaiki' });
    assert.equal(editLog.actorRole, 'student');
    await repository.updateProject(owned.id, { isPublished: false }, owner);
    await repository.updateProject(owned.id, { isPublished: true }, owner);
    await repository.updateProject(owned.id, { isPublished: false, publicationReason: 'Video perlu diperbaiki.' }, admin);
    assert.deepEqual(await repository.updateProject(owned.id, { isPublished: true }, owner), { error: 'publication_locked' });
    assert.equal((await repository.findProjectById(owned.id)).publicationReason, 'Video perlu diperbaiki.');
    await repository.updateProject(owned.id, { isPublished: true }, admin);
    assert.equal((await repository.findProjectById(owned.id)).publicationReason, null);
    assert.equal((await repository.deleteProject(owned.id, owner)).id, owned.id);
    assert.equal(await repository.findProjectById(owned.id), null);

    const submission = await repository.createSubmission({ title: 'Pengajuan baru', nim: 'B2', student: 'Pemilik' }, owner);
    const [cancel, approve] = await Promise.all([
      repository.deletePendingSubmission(submission.id, owner.nim, owner),
      repository.approveSubmission(submission.id, admin)
    ]);
    assert.equal(Boolean(cancel.submission) !== Boolean(approve.project), true);
    assert.equal((await repository.listProjects({ search: 'Pengajuan baru' })).total, approve.project ? 1 : 0);
  } finally {
    await db.close();
  }
});
