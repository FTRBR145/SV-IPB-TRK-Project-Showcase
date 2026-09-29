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
