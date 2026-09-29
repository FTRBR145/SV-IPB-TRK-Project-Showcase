import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { register } from 'tsx/esm/api';
import { registerHooks } from 'node:module';

registerHooks({ load(url, context, next) { return url.endsWith('.css') ? { format: 'module', source: 'export default {};', shortCircuit: true } : next(url, context); } });
register({ tsconfig: './jsconfig.json' });
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://localhost', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'ShadowRoot', 'MutationObserver', 'HTMLInputElement', 'HTMLButtonElement']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
window.scrollTo = () => {};
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const nativeFocus = dom.window.HTMLElement.prototype.focus;
dom.window.HTMLElement.prototype.focus = function (options) { void options?.preventScroll; nativeFocus.call(this, options); };
dom.window.HTMLElement.prototype.getClientRects = function () {
  return this.isConnected && !this.hidden && getComputedStyle(this).display !== 'none'
    ? [{ width: 100, height: 40, top: 0, left: 0, right: 100, bottom: 40 }] : [];
};

const { default: React } = await import('react');
const { render, screen, waitFor, cleanup, act } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { MemoryRouter, Route, Routes, useLocation } = await import('react-router-dom');
const { default: AppContext } = await import('../context/AppContextStore.js');
const { ProjectRoute } = await import('../App.jsx');
const { default: LandingPage } = await import('./LandingPage.jsx');
const { default: StudentHome } = await import('./StudentHome.jsx');
const h = React.createElement;
const publicProject = { id: 2, title: 'Sensor Kelas', student: 'Nabila', nim: 'J0304211015', semester: 5, course: 'APLIKASI MOBILE', techStack: [] };
const hiddenProject = { ...publicProject, id: 3, title: 'Sensor Privat', isPublished: false };
const pendingProject = { ...publicProject, id: 4, title: 'Sensor Menunggu', status: 'pending' };

function LocationProbe() {
  const location = useLocation();
  return h('output', { 'data-testid': 'location' }, `${location.pathname}${location.search}|${location.state?.from || ''}`);
}

function showPage(page, initialPath, authenticated = false) {
  const user = authenticated ? { role: 'student', name: 'Nabila', nim: 'J0304211015' } : null;
  return render(h(AppContext.Provider, { value: {
    currentUser: user, isLoggedIn: authenticated, isAuthReady: true,
    projects: [publicProject], ownProjects: [publicProject, hiddenProject], submissions: [pendingProject],
    catalogStatus: 'ready', courses: [], adminSettings: { siteName: 'Showcase TRK' },
    showToast() {}, logout() {}, updateSubmission() {}
  } }, h(MemoryRouter, { initialEntries: [initialPath] }, h(React.Fragment, null,
    h(Routes, null,
      h(Route, { path: '/', element: page === 'landing' || page === 'gate' ? h(LandingPage) : h('p', null, 'Landing') }),
      h(Route, { path: '/student', element: h(StudentHome) }),
      h(Route, { path: '/project/:projectId', element: page === 'gate' ? h(ProjectRoute) : h('p', null, 'Halaman penuh') })
    ), h(LocationProbe)
  ))));
}

afterEach(async () => { cleanup(); mock.restoreAll(); await act(async () => {}); });

test('guest shared detail route opens landing modal without login', async () => {
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ data: publicProject })));
  const user = userEvent.setup();
  showPage('gate', '/project/2');
  await waitFor(() => assert.equal(screen.getByTestId('location').textContent, '/?project=2|/project/2'));
  assert.ok(await screen.findByRole('dialog', { name: 'Detail projek Sensor Kelas' }));
  assert.equal(screen.queryByRole('button', { name: 'Buka halaman penuh' }), null);
  await user.click(screen.getByRole('button', { name: 'Tutup detail projek' }));
  assert.equal(screen.getByTestId('location').textContent, '/|/project/2');
});

test('landing card and legacy link open modal; only signed-in users can open full page', async () => {
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ data: publicProject })));
  const user = userEvent.setup();
  showPage('landing', '/');
  await user.click(screen.getByRole('button', { name: 'Lihat detail Sensor Kelas' }));
  assert.ok(await screen.findByRole('dialog', { name: 'Detail projek Sensor Kelas' }));
  assert.match(screen.getByTestId('location').textContent, /^\/\?project=2\|/);
  assert.equal(screen.queryByRole('button', { name: 'Buka halaman penuh' }), null);
  cleanup();
  showPage('landing', '/?project=2', true);
  assert.ok(await screen.findByRole('dialog', { name: 'Detail projek Sensor Kelas' }));
  await user.click(screen.getByRole('button', { name: 'Buka halaman penuh' }));
  assert.ok(screen.getByText('Halaman penuh'));
});

test('student cards open full page for approved projects and modal for pending submissions', async () => {
  const user = userEvent.setup();
  showPage('student', '/student?tab=my-projects&semester=5', true);
  await user.click(screen.getByRole('button', { name: 'Lihat detail Sensor Privat' }));
  assert.ok(screen.getByText('Halaman penuh'));
  assert.equal(screen.getByTestId('location').textContent, '/project/3|/student?tab=my-projects&semester=5');
  cleanup();
  showPage('student', '/student?tab=my-projects&semester=5', true);
  await user.click(screen.getByRole('button', { name: 'Lihat detail Sensor Menunggu' }));
  assert.ok(await screen.findByRole('dialog', { name: 'Detail projek Sensor Menunggu' }));
  assert.equal(screen.getByTestId('location').textContent, '/student?tab=my-projects&semester=5&submission=4|');
});
