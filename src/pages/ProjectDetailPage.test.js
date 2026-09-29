import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { register } from 'tsx/esm/api';
import { registerHooks } from 'node:module';

registerHooks({ load(url, context, next) { return url.endsWith('.css') ? { format: 'module', source: 'export default {};', shortCircuit: true } : next(url, context); } });
register({ tsconfig: './jsconfig.json' });
const dom = new JSDOM('<!doctype html><html><head><meta name="description" content="Awal"></head><body></body></html>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React } = await import('react');
const { render, screen, waitFor, cleanup } = await import('@testing-library/react');
const { MemoryRouter, Route, Routes } = await import('react-router-dom');
const { default: AppContext } = await import('../context/AppContextStore.js');
const { default: ProjectDetailPage } = await import('./ProjectDetailPage.jsx');
const h = React.createElement;

afterEach(() => { cleanup(); mock.restoreAll(); });

function showPage(id, from = '/student') {
  return render(h(AppContext.Provider, { value: {
    currentUser: { role: 'student', name: 'Nabila' }, isLoggedIn: true, logout() {},
    adminSettings: { siteName: 'Showcase TRK' }, courses: []
  } }, h(MemoryRouter, { initialEntries: [{ pathname: `/project/${id}`, state: { from } }] },
    h(Routes, null, h(Route, { path: '/project/:projectId', element: h(ProjectDetailPage) })))));
}

test('direct project route loads content and copies its canonical link', async () => {
  const project = { id: 2, title: 'Sensor Kelas', student: 'Nabila', course: 'APLIKASI MOBILE',
    description: 'Memantau suhu ruangan.', videoUrl: 'https://www.youtube.com/embed/abcdefghijk' };
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ data: project })));
  const copied = [];
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { copied.push(text); } } });
  showPage(2);
  assert.ok(await screen.findByRole('heading', { name: 'Sensor Kelas', level: 1 }));
  await waitFor(() => assert.equal(document.title, 'Sensor Kelas | Showcase TRK'));
  screen.getByRole('button', { name: 'Salin tautan' }).click();
  await waitFor(() => assert.equal(copied[0], 'http://localhost/project/2'));
  assert.ok(screen.getByText('Tautan projek tersalin.'));
  assert.equal(screen.getByRole('link', { name: 'Kembali ke portal' }).getAttribute('href'), '/student');
});

test('return link keeps portal filters', async () => {
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ data: { id: 2, title: 'Sensor Kelas', student: 'Nabila' } })));
  showPage(2, '/student?tab=my-projects&semester=5&search=sensor');
  assert.ok(await screen.findByRole('heading', { name: 'Sensor Kelas', level: 1 }));
  assert.equal(screen.getByRole('link', { name: 'Kembali ke portal' }).getAttribute('href'), '/student?tab=my-projects&semester=5&search=sensor');
});

test('a missing project shows a clear 404 state without stale details', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 404 }));
  showPage(999);
  assert.ok(await screen.findByRole('heading', { name: 'Projek tidak ditemukan', level: 1 }));
  assert.equal(screen.queryByRole('button', { name: 'Salin tautan' }), null);
});
