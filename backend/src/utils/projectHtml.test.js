import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import request from 'supertest';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { createSeedData } from '../data/seed.js';
import { createMemoryRepository } from '../repositories/memoryRepository.js';
import { projectHtml, siteOrigin } from './projectHtml.js';

const html = await readFile(new URL('../../../index.html', import.meta.url), 'utf8');

test('project metadata is escaped and unique in initial HTML', () => {
  const output = projectHtml(html, {
    title: 'Projek <Sensor> & IoT', student: 'Mahasiswa',
    description: 'Pemantauan suhu dengan ESP32.',
    videoUrl: 'https://www.youtube.com/embed/abcdefghijk'
  }, `${siteOrigin}/project/4`);
  assert.match(output, /<title>Projek &lt;Sensor&gt; &amp; IoT \| Showcase Projek TRK<\/title>/);
  assert.match(output, /og:image.*i\.ytimg\.com\/vi\/abcdefghijk/);
  assert.match(output, /rel="canonical" href="https:\/\/sv-ipb-trk-project-showcase\.vercel\.app\/project\/4"/);
  assert.equal((output.match(/name="description"/g) || []).length, 1);
});

test('server-rendered detail exposes metadata only for public projects', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([String(url), options?.headers?.cookie]);
    return new Response(html);
  };
  try {
    const app = createApp({ repository: createMemoryRepository(createSeedData()) });
    const publicPage = await request(app).get('/project/2').expect(200);
    assert.match(publicPage.text, /property="og:title"/);
    assert.match(publicPage.text, /rel="canonical"/);
    assert.match(publicPage.headers['content-security-policy'], /frame-src https:\/\/www\.youtube\.com/);
    assert.deepEqual(calls, [[`${siteOrigin}/index.html`, undefined]]);

    const admin = request.agent(app);
    await admin.post(env.apiPrefix + '/auth/login').send({ identifier: env.adminEmail, password: env.adminPassword }).expect(200);
    await admin.patch(env.apiPrefix + '/projects/2').send({ isPublished: false }).expect(200);
    const hiddenPage = await request(app).get('/project/2').expect(404);
    assert.match(hiddenPage.text, /name="robots" content="noindex"/);
    assert.doesNotMatch(hiddenPage.text, /property="og:title"/);
    await request(app).get('/project/999').expect(404);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
