import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, apiRequest } from '../../frontend/src/services/api.js';

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
