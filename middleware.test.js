import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import middleware, { projectHtml } from './middleware.js';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const project = {
  title: 'Projek <Sensor> & IoT', student: 'Mahasiswa',
  description: 'Pemantauan suhu dengan ESP32.',
  videoUrl: 'https://www.youtube.com/embed/abcdefghijk'
};

test('project metadata is escaped and unique in initial HTML', () => {
  const output = projectHtml(html, project, 'https://example.com/project/4');
  assert.match(output, /<title>Projek &lt;Sensor&gt; &amp; IoT \| Showcase Projek TRK<\/title>/);
  assert.match(output, /og:image.*i\.ytimg\.com\/vi\/abcdefghijk/);
  assert.match(output, /rel="canonical" href="https:\/\/example\.com\/project\/4"/);
  assert.equal((output.match(/name="description"/g) || []).length, 1);
});

test('middleware uses the public API and excludes missing projects from previews', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async input => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('/index.html')) return new Response(html);
    return new Response(JSON.stringify({ success: true, data: project }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const response = await middleware(new Request('https://example.com/project/4'));
    assert.equal(response.status, 200);
    assert.match(await response.text(), /og:title/);
    assert.deepEqual(calls, ['https://example.com/index.html', 'https://example.com/api/projects/4']);
    globalThis.fetch = async input => String(input).endsWith('/index.html')
      ? new Response(html)
      : new Response('{}', { status: 404 });
    const hidden = await middleware(new Request('https://example.com/project/4'));
    assert.equal(hidden.status, 404);
    assert.doesNotMatch(await hidden.text(), /og:title/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
