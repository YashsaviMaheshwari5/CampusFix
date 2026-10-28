import test from 'node:test';
import assert from 'node:assert/strict';
import process from 'node:process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { MAX_IMAGE_SIZE } from '../src/utils/imageValidation.js';

const testMongoUri = process.env.TEST_MONGODB_URI;
const clientOrigin = 'http://localhost:5173';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'campusfix-http-test-secret-please-use-a-long-random-value';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = clientOrigin;
process.env.COOKIE_SECURE = 'false';
if (testMongoUri) process.env.MONGODB_URI = testMongoUri;
const uploadDirectory = await mkdtemp(path.join(os.tmpdir(), 'campusfix-http-uploads-'));
process.env.CAMPUSFIX_UPLOAD_DIR = uploadDirectory;

const [{ app }, mongoose] = await Promise.all([
  import('../src/app.js'),
  import('mongoose').then((module) => module.default),
]);
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => {
  server.once('listening', resolve);
  server.once('error', reject);
});
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
const request = (route, options) => fetch(`${baseUrl}${route}`, options);
const cookieFrom = (response) => response.headers.get('set-cookie')?.split(';', 1)[0];
const json = (value) => ({ 'content-type': 'application/json', ...value });

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await rm(uploadDirectory, { recursive: true, force: true });
});

test('Express HTTP health, JSON parsing, and CORS behavior', async () => {
  const health = await request('/health');
  assert.equal(health.status, 200);
  assert.equal((await health.json()).success, true);

  const malformedJson = await request('/auth/register', {
    method: 'POST', headers: json(), body: '{invalid-json',
  });
  assert.equal(malformedJson.status, 400);
  assert.equal((await malformedJson.json()).error.code, 'INVALID_JSON');

  const preflight = await request('/complaints', {
    method: 'OPTIONS', headers: { origin: clientOrigin, 'access-control-request-method': 'POST' },
  });
  assert.equal(preflight.headers.get('access-control-allow-origin'), clientOrigin);
  assert.equal(preflight.headers.get('access-control-allow-credentials'), 'true');

  const deniedOrigin = await request('/complaints', {
    method: 'POST', headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' }, body: '{}',
  });
  assert.equal(deniedOrigin.status, 403);
  assert.equal((await deniedOrigin.json()).error.code, 'INVALID_ORIGIN');
});

test('Express HTTP authenticated workflows with isolated MongoDB', { skip: !testMongoUri && 'Set TEST_MONGODB_URI to an isolated MongoDB database ending in _test.' }, async (t) => {
  const uri = new URL(testMongoUri);
  const databaseName = decodeURIComponent(uri.pathname.replace(/^\//, ''));
  if (!/_test$/i.test(databaseName)) throw new Error('Refusing HTTP tests: TEST_MONGODB_URI database name must end in "_test".');

  await mongoose.connect(testMongoUri, { serverSelectionTimeoutMS: 4000 });
  await mongoose.connection.dropDatabase();
  t.after(async () => { await mongoose.connection.dropDatabase(); });
  const models = await Promise.all([
    import('../src/models/User.js'), import('../src/models/Complaint.js'), import('../src/models/Notification.js'),
    import('../src/models/Feedback.js'), import('../src/models/Session.js'),
  ]);
  await Promise.all(models.map(({ default: Model }) => Model.init()));
  const User = models[0].default;
  const Complaint = models[1].default;

  const credentials = { name: 'HTTP Test Student', email: `http-student-${Date.now()}@example.test`, password: 'secure-test-password' };
  const registration = await request('/auth/register', { method: 'POST', headers: json(), body: JSON.stringify(credentials) });
  assert.equal(registration.status, 201);
  const registrationCookie = cookieFrom(registration);
  assert.ok(registrationCookie?.startsWith('campusfix_token='));
  const cookieAttributes = registration.headers.get('set-cookie').toLowerCase();
  assert.match(cookieAttributes, /httponly/);
  assert.match(cookieAttributes, /samesite=strict/);
  assert.equal(registration.headers.get('access-control-allow-origin'), clientOrigin);
  assert.equal(registration.headers.get('access-control-allow-credentials'), 'true');
  assert.equal((await registration.json()).data.user.role, 'student');

  const duplicate = await request('/auth/register', { method: 'POST', headers: json(), body: JSON.stringify(credentials) });
  assert.equal(duplicate.status, 409);
  const validation = await request('/auth/register', { method: 'POST', headers: json(), body: JSON.stringify({ ...credentials, password: 'short' }) });
  assert.equal(validation.status, 400);

  const login = await request('/auth/login', { method: 'POST', headers: json(), body: JSON.stringify({ email: credentials.email, password: credentials.password }) });
  assert.equal(login.status, 200);
  const studentCookie = cookieFrom(login);
  const unauthenticated = await request('/auth/me');
  assert.equal(unauthenticated.status, 401);
  const me = await request('/auth/me', { headers: { cookie: studentCookie } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).data.user.email, credentials.email);

  const invalidComplaint = await request('/complaints', { method: 'POST', headers: { cookie: studentCookie, ...json() }, body: JSON.stringify({ title: 'x' }) });
  assert.equal(invalidComplaint.status, 400);
  const complaintResponse = await request('/complaints', {
    method: 'POST', headers: { cookie: studentCookie, ...json() },
    body: JSON.stringify({ title: 'Broken classroom light', description: 'The lights are not working in room 12.', category: 'Electricity', location: 'Room 12', priority: 'Medium' }),
  });
  assert.equal(complaintResponse.status, 201);
  const complaint = (await complaintResponse.json()).data.complaint;
  assert.ok(await Complaint.findById(complaint._id));
  const retrieval = await request(`/complaints/${complaint._id}`, { headers: { cookie: studentCookie } });
  assert.equal(retrieval.status, 200);

  const otherRegistration = await request('/auth/register', { method: 'POST', headers: json(), body: JSON.stringify({ ...credentials, name: 'Other Student', email: `other-${Date.now()}@example.test` }) });
  const otherCookie = cookieFrom(otherRegistration);
  const forbidden = await request(`/complaints/${complaint._id}`, { headers: { cookie: otherCookie } });
  assert.equal(forbidden.status, 403);

  const { hashPassword } = await import('../src/utils/password.js');
  const staff = await User.create({ name: 'HTTP Test Staff', email: `staff-${Date.now()}@example.test`, passwordHash: await hashPassword(credentials.password), role: 'staff' });
  assert.ok(staff._id);
  const staffLogin = await request('/auth/login', { method: 'POST', headers: json(), body: JSON.stringify({ email: staff.email, password: credentials.password }) });
  assert.equal(staffLogin.status, 200);
  const staffCookie = cookieFrom(staffLogin);
  assert.ok(staffCookie);
  const staffStatus = await request(`/staff/complaints/${complaint._id}/status`, { method: 'PATCH', headers: { cookie: staffCookie, ...json() }, body: JSON.stringify({ status: 'Acknowledged', note: 'Received by facilities.' }) });
  assert.equal(staffStatus.status, 200);
  assert.equal((await staffStatus.json()).data.complaint.statusHistory.length, 2);
  const studentStatusAttempt = await request(`/staff/complaints/${complaint._id}/status`, { method: 'PATCH', headers: { cookie: studentCookie, ...json() }, body: JSON.stringify({ status: 'In Progress' }) });
  assert.equal(studentStatusAttempt.status, 403);

  const notifications = await request('/notifications', { headers: { cookie: studentCookie } });
  assert.equal(notifications.status, 200);
  assert.ok((await notifications.json()).data.notifications.length >= 2);

  const forgedImage = new FormData();
  forgedImage.set('title', 'Upload signature rejection');
  forgedImage.set('description', 'This uploaded content is not an image.');
  forgedImage.set('category', 'Other');
  forgedImage.set('location', 'Library');
  forgedImage.set('priority', 'Low');
  forgedImage.set('attachments', new Blob(['not an image signature']), 'fake.png');
  const invalidUpload = await request('/complaints', { method: 'POST', headers: { cookie: studentCookie }, body: forgedImage });
  assert.equal(invalidUpload.status, 400);
  assert.equal((await invalidUpload.json()).error.code, 'INVALID_FILE_TYPE');
  assert.deepEqual(await readdir(uploadDirectory), []);

  const tooLarge = new FormData();
  tooLarge.set('title', 'Oversized attachment');
  tooLarge.set('description', 'This upload exceeds the configured file limit.');
  tooLarge.set('category', 'Other');
  tooLarge.set('location', 'Library');
  tooLarge.set('priority', 'Low');
  const oversizedPng = new Uint8Array(MAX_IMAGE_SIZE + 1);
  oversizedPng.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  tooLarge.set('attachments', new Blob([oversizedPng], { type: 'image/png' }), 'large.png');
  const oversizedResponse = await request('/complaints', { method: 'POST', headers: { cookie: studentCookie }, body: tooLarge });
  assert.equal(oversizedResponse.status, 400);
  assert.equal((await oversizedResponse.json()).error.code, 'UPLOAD_ERROR');
  assert.deepEqual(await readdir(uploadDirectory), []);

  const logout = await request('/auth/logout', { method: 'POST', headers: { cookie: studentCookie } });
  assert.equal(logout.status, 200);
  const clearedCookie = logout.headers.get('set-cookie');
  assert.ok(clearedCookie, 'logout must return a Set-Cookie header to clear the browser cookie');
  const clearedCookieAttributes = clearedCookie.toLowerCase();
  assert.match(clearedCookieAttributes, /^campusfix_token=;/);
  assert.match(clearedCookieAttributes, /path=\//);
  assert.match(clearedCookieAttributes, /expires=thu, 01 jan 1970 00:00:00 gmt/);
  assert.match(clearedCookieAttributes, /httponly/);
  assert.match(clearedCookieAttributes, /samesite=strict/);
  if (process.env.COOKIE_SECURE === 'true') assert.match(clearedCookieAttributes, /; secure(?:;|$)/);
  assert.equal((await request('/auth/me', { headers: { cookie: studentCookie } })).status, 401);
});
