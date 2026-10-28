import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, apiRequest } from '../../frontend/src/services/api.js';
import { authService } from '../../frontend/src/services/authService.js';

test('frontend API sends credentials, JSON, and returns the response data', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ success: true, data: { id: 'c1' } }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  };
  const data = await apiRequest('/complaints', { method: 'POST', body: { title: 'Broken light' } });
  assert.deepEqual(data, { id: 'c1' });
  assert.equal(request.options.credentials, 'include');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(request.options.body), { title: 'Broken light' });
});

test('frontend API turns HTTP and network failures into useful errors', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } }), { status: 401 });
  await assert.rejects(apiRequest('/auth/me'), (error) => error instanceof ApiError && error.status === 401 && error.message === 'Please sign in.');
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(apiRequest('/health'), (error) => error instanceof ApiError && error.code === 'NETWORK_ERROR');
});

test('frontend API preserves request cancellation', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => { const error = new Error('cancelled'); error.name = 'AbortError'; throw error; };
  await assert.rejects(apiRequest('/complaints'), (error) => error.name === 'AbortError');
});

test('auth service sends the backend registration and login request bodies', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const requests = [];
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ success: true, data: { user: { id: 'u1' } } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await authService.register({ name: 'Test Student', email: 'student@example.test', password: 'secure-password' });
  await authService.login({ email: 'student@example.test', password: 'secure-password' });

  assert.equal(requests[0].url.endsWith('/auth/register'), true);
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    name: 'Test Student', email: 'student@example.test', password: 'secure-password',
  });
  assert.equal(requests[0].options.credentials, 'include');
  assert.equal(requests[1].url.endsWith('/auth/login'), true);
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    email: 'student@example.test', password: 'secure-password',
  });
});
