import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClientError } from './apiClient.js';
import { restoreCookieSession } from './sessionApi.js';

test('page refresh always restores the user through /auth/me without localStorage', async () => {
  let storageReads = 0;
  globalThis.localStorage = {
    getItem() {
      storageReads += 1;
      throw new Error('localStorage must not be read');
    }
  };
  const user = { id: 7, name: 'Nabila', role: 'student' };
  const calls = [];
  const request = async (...args) => {
    calls.push(args);
    return user;
  };

  assert.deepEqual(await restoreCookieSession({ request }), user);
  assert.deepEqual(calls, [['/auth/me', { signal: undefined }]]);
  assert.equal(storageReads, 0);
});

test('an anonymous refresh resolves without masking non-authentication failures', async () => {
  const unauthorized = async () => {
    throw new ApiClientError('Autentikasi diperlukan.', { status: 401, code: 'UNAUTHORIZED' });
  };
  assert.equal(await restoreCookieSession({ request: unauthorized }), null);

  const unavailable = new ApiClientError('Backend tidak tersedia.', { status: 503 });
  await assert.rejects(
    restoreCookieSession({ request: async () => { throw unavailable; } }),
    error => error === unavailable
  );
});
