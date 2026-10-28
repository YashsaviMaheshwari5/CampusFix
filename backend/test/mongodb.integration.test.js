import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';
import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const testMongoUri = process.env.TEST_MONGODB_URI;

function makeResponse() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    cookie(name, value, options) { this.cookieValue = value; this.cookieName = name; this.cookieOptions = options; return this; },
    clearCookie(name, options) { this.clearedCookie = name; this.clearCookieOptions = options; return this; },
    type(value) { this.contentType = value; return this; },
    sendFile(path, callback) { this.filePath = path; callback(); return this; },
    end() { this.ended = true; return this; },
  };
}

function multipartRequest(fields, file, boundary = 'campusfix-test-boundary') {
  const chunks = [];
  for (const [name, value] of Object.entries(fields)) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }
  if (file) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="attachments"; filename="${file.filename}"\r\nContent-Type: ${file.mimeType}\r\n\r\n`));
    chunks.push(file.bytes);
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(chunks);
  const req = Readable.from([body]);
  req.headers = { 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': String(body.length) };
  req.method = 'POST';
  req.url = '/api/complaints';
  return req;
}

async function runUpload(middleware, req) {
  let failure;
  await new Promise((resolve) => middleware(req, {}, (error) => { failure = error; resolve(); }));
  if (failure) throw failure;
  return req;
}

test('MongoDB-backed CampusFix controller workflows', { skip: !testMongoUri && 'Set TEST_MONGODB_URI to an isolated MongoDB database ending in _test.' }, async (t) => {
  const uri = new URL(testMongoUri);
  const databaseName = decodeURIComponent(uri.pathname.replace(/^\//, ''));
  if (!/_test$/i.test(databaseName)) {
    throw new Error('Refusing integration tests: TEST_MONGODB_URI database name must end in "_test", such as campusfix_test.');
  }

  process.env.MONGODB_URI = testMongoUri;
  process.env.JWT_SECRET = 'mongodb-integration-test-secret-with-at-least-32-characters';
  process.env.JWT_EXPIRES_IN = '1h';
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(testMongoUri);
  await mongoose.connection.dropDatabase();
  t.after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  const [{ register, login, me, logout, updatePreferences }, complaintController, otherController, authMiddleware, uploadMiddleware, UserModule, ComplaintModule, NotificationModule, FeedbackModule, SessionModule] = await Promise.all([
    import('../src/controllers/authController.js'),
    import('../src/controllers/complaintController.js'),
    import('../src/controllers/otherController.js'),
    import('../src/middleware/auth.js'),
    import('../src/middleware/upload.js'),
    import('../src/models/User.js'), import('../src/models/Complaint.js'), import('../src/models/Notification.js'), import('../src/models/Feedback.js'), import('../src/models/Session.js'),
  ]);
  const User = UserModule.default;
  const Complaint = ComplaintModule.default;
  const Notification = NotificationModule.default;
  const Feedback = FeedbackModule.default;
  const Session = SessionModule.default;
  await Promise.all([User.init(), Complaint.init(), Notification.init(), Feedback.init(), Session.init()]);
  const uploadDirectory = fileURLToPath(new URL('../uploads/', import.meta.url));
  const baselineUploadFiles = new Set(await readdir(uploadDirectory));
  t.after(async () => {
    const files = await readdir(uploadDirectory);
    await Promise.allSettled(files.filter((name) => !baselineUploadFiles.has(name)).map((name) => unlink(path.join(uploadDirectory, name))));
  });

  const password = 'safe-integration-password';
  const firstAgent = { email: `student-${Date.now()}@example.test`, cookie: '' };
  let strangerAgent;
  const registerAgent = async (agent, name) => {
    const response = makeResponse();
    await register({ body: { name, email: agent.email, password } }, response);
    assert.equal(response.statusCode, 201);
    agent.cookie = response.cookieValue;
    agent.user = await User.findOne({ email: agent.email });
    return response.body.data.user;
  };
  const authenticate = async (cookie) => {
    const req = { cookies: { campusfix_token: cookie } };
    await new Promise((resolve, reject) => authMiddleware.requireAuth(req, {}, (error) => error ? reject(error) : resolve()));
    return req;
  };
  const invoke = async (handler, req) => {
    const response = makeResponse();
    await handler(req, response);
    return response;
  };

  await t.test('registration, duplicate rejection, login, current user, profile preferences, and revocation records', async () => {
    const registered = await registerAgent(firstAgent, 'CampusFix Student');
    assert.equal(registered.email, firstAgent.email);
    assert.equal('passwordHash' in registered, false);
    await assert.rejects(register({ body: { name: 'Duplicate', email: firstAgent.email, password } }, makeResponse()), (error) => error.statusCode === 409);
    const beforeLogout = await authenticate(firstAgent.cookie);
    assert.equal(beforeLogout.user.email, firstAgent.email);
    const current = await invoke(me, beforeLogout);
    assert.equal(String(current.body.data.user.id), String(firstAgent.user._id));

    await assert.rejects(login({ body: { email: firstAgent.email, password: 'wrong-password' } }, makeResponse()), (error) => error.statusCode === 401);
    const loginResponse = makeResponse();
    await login({ body: { email: firstAgent.email, password } }, loginResponse);
    assert.equal(loginResponse.statusCode, 200);
    firstAgent.cookie = loginResponse.cookieValue;
    assert.equal((await authenticate(firstAgent.cookie)).user.email, firstAgent.email);

    const preferencesResponse = await invoke(updatePreferences, { ...(await authenticate(firstAgent.cookie)), body: { name: 'Updated Student', notifications: false } });
    assert.equal(preferencesResponse.body.data.user.name, 'Updated Student');
    assert.equal(preferencesResponse.body.data.user.preferences.notifications, false);
    assert.equal((await User.findById(firstAgent.user._id)).name, 'Updated Student');
    const session = await Session.findOne({ user: firstAgent.user._id }).select('+tokenIdHash');
    assert.ok(session.tokenIdHash);
    assert.notEqual(session.tokenIdHash, firstAgent.cookie);
  });

  let complaintId;
  await t.test('complaint persistence, title/description search, filters, pagination, stats, and cross-user permissions', async () => {
    const owner = await authenticate(firstAgent.cookie);
    const created = await invoke(complaintController.create, { ...owner, body: { title: 'Leaking faucet in Block B', description: 'Water is leaking continuously from the washroom faucet.', category: 'Water', location: 'Hostel Block B', priority: 'High' }, files: [] });
    assert.equal(created.statusCode, 201);
    complaintId = created.body.data.complaint._id;
    assert.equal(String((await Complaint.findById(complaintId)).submittedBy), String(firstAgent.user._id));

    const listed = await invoke(complaintController.list, { ...owner, query: { search: 'continuously', status: 'Submitted', page: '1', limit: '1', sort: 'priority' } });
    assert.equal(listed.body.data.complaints.length, 1);
    assert.equal(listed.body.data.pagination.total, 1);
    await assert.rejects(complaintController.list({ ...owner, query: { status: 'invalid' } }, makeResponse()), (error) => error.statusCode === 400);
    const details = await invoke(complaintController.getOne, { ...owner, params: { id: complaintId } });
    assert.equal(details.body.data.complaint.statusHistory[0].status, 'Submitted');
    assert.ok(await Complaint.exists({ _id: complaintId }), 'the complaint fixture must still exist before checking another user access');
    const dashboard = await invoke(otherController.stats, owner);
    assert.equal(dashboard.body.data.total, 1);
    assert.equal(dashboard.body.data.submitted, 1);

    strangerAgent = { email: `stranger-${Date.now()}@example.test`, cookie: '' };
    await registerAgent(strangerAgent, 'Other Student');
    const otherUser = await authenticate(strangerAgent.cookie);
    await assert.rejects(complaintController.getOne({ ...otherUser, params: { id: complaintId } }, makeResponse()), (error) => error.statusCode === 403);
    await assert.rejects(complaintController.update({ ...otherUser, params: { id: complaintId }, body: { title: 'Not mine' } }, makeResponse()), (error) => error.statusCode === 403);
    await assert.rejects(complaintController.remove({ ...otherUser, params: { id: complaintId } }, makeResponse()), (error) => error.statusCode === 403);
    assert.equal((await (await invoke(complaintController.list, { ...otherUser, query: {} })).body.data.complaints).length, 0);
  });

  await t.test('status transition history, emitted notifications, read-all, and feedback history', async () => {
    const staffAgent = { email: `staff-${Date.now()}@example.test`, cookie: '' };
    await registerAgent(staffAgent, 'Campus Staff');
    await User.updateOne({ _id: staffAgent.user._id }, { $set: { role: 'staff' } });
    const staff = await authenticate(staffAgent.cookie);
    const owner = await authenticate(firstAgent.cookie);
    await updatePreferences({ ...owner, body: { notifications: true } }, makeResponse());

    await complaintController.update({ ...staff, params: { id: complaintId }, body: { status: 'Acknowledged', note: 'Reviewed by facilities.' } }, makeResponse());
    await complaintController.update({ ...staff, params: { id: complaintId }, body: { status: 'In Progress', note: 'Repair scheduled.' } }, makeResponse());
    await assert.rejects(complaintController.update({ ...staff, params: { id: complaintId }, body: { status: 'Submitted' } }, makeResponse()), (error) => error.statusCode === 400);
    const details = await invoke(complaintController.getOne, { ...owner, params: { id: complaintId } });
    assert.deepEqual(details.body.data.complaint.statusHistory.map((entry) => entry.status), ['Submitted', 'Acknowledged', 'In Progress']);
    const notificationList = await invoke(otherController.notifications, owner);
    assert.ok(notificationList.body.data.notifications.some((entry) => entry.title === 'Complaint status updated'));
    await otherController.readAllNotifications(owner, makeResponse());
    assert.equal(await Notification.countDocuments({ user: firstAgent.user._id, readAt: null }), 0);

    await otherController.createFeedback({ ...owner, body: { rating: 5, message: 'Helpful and clear.' } }, makeResponse());
    const feedback = await invoke(otherController.feedbackList, owner);
    assert.equal(feedback.body.data.feedback.length, 1);
    assert.equal(feedback.body.data.feedback[0].rating, 5);
    await assert.rejects(otherController.createFeedback({ ...owner, body: { rating: 8, message: 'Invalid rating' } }, makeResponse()), (error) => error.statusCode === 400);
    assert.equal(await Feedback.countDocuments({ user: firstAgent.user._id }), 1);
  });

  await t.test('Multer validates file content/size, persists metadata, protects retrieval, and cleans failed uploads', async () => {
    const image = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const owner = await authenticate(firstAgent.cookie);
    const upload = await runUpload(uploadMiddleware.complaintImages, multipartRequest({ title: 'Broken light fixture', description: 'The light fixture is broken in the corridor.', category: 'Electricity', location: 'Main Corridor', priority: 'Medium' }, { filename: 'fixture.png', mimeType: 'image/png', bytes: image }));
    const submitted = await invoke(complaintController.create, { ...owner, body: upload.body, files: upload.files });
    const savedComplaint = submitted.body.data.complaint;
    const attachment = savedComplaint.attachments[0];
    assert.equal(attachment.mimeType, 'image/png');
    assert.equal((await Complaint.findById(savedComplaint._id)).attachments.length, 1);

    const download = makeResponse();
    await complaintController.getAttachment({ ...owner, params: { id: savedComplaint._id, filename: attachment.filename } }, download, (error) => { if (error) throw error; });
    assert.equal(download.contentType, 'image/png');
    assert.deepEqual(await readFile(download.filePath), image);
    const stranger = await authenticate(strangerAgent.cookie);
    await assert.rejects(complaintController.getAttachment({ ...stranger, params: { id: savedComplaint._id, filename: attachment.filename } }, makeResponse(), () => {}), (error) => error.statusCode === 403);

    const beforeInvalid = (await readdir(uploadDirectory)).sort();
    await assert.rejects(runUpload(uploadMiddleware.complaintImages, multipartRequest({ title: 'Invalid' }, { filename: 'bad.svg', mimeType: 'image/svg+xml', bytes: Buffer.from('<svg/>') })), (error) => error.statusCode === 400);
    await assert.rejects(runUpload(uploadMiddleware.complaintImages, multipartRequest({ title: 'Wrong image bytes' }, { filename: 'bad.png', mimeType: 'image/png', bytes: Buffer.from('not a png') })), (error) => error.statusCode === 400);
    await assert.rejects(runUpload(uploadMiddleware.complaintImages, multipartRequest({ title: 'Too large' }, { filename: 'large.png', mimeType: 'image/png', bytes: Buffer.alloc(5 * 1024 * 1024 + 1) })), (error) => error.code === 'LIMIT_FILE_SIZE');

    const invalidCreation = await runUpload(uploadMiddleware.complaintImages, multipartRequest({ title: 'Missing required fields' }, { filename: 'orphan.png', mimeType: 'image/png', bytes: image }));
    await assert.rejects(complaintController.create({ ...owner, body: invalidCreation.body, files: invalidCreation.files }, makeResponse()), (error) => error.statusCode === 400);
    assert.deepEqual((await readdir(uploadDirectory)).sort(), beforeInvalid, 'invalid requests leave no uploaded file behind');
  });

  await t.test('logout revokes persisted session and rejects replay of the copied cookie token', async () => {
    const loginResponse = makeResponse();
    await login({ body: { email: firstAgent.email, password } }, loginResponse);
    const copiedCookie = loginResponse.cookieValue;
    const authenticated = await authenticate(copiedCookie);
    assert.ok(authenticated.authSession);
    const logoutResponse = await invoke(logout, authenticated);
    assert.equal(logoutResponse.clearedCookie, 'campusfix_token');
    assert.equal(logoutResponse.clearCookieOptions.path, '/');
    assert.equal(logoutResponse.clearCookieOptions.httpOnly, true);
    assert.equal(logoutResponse.clearCookieOptions.sameSite, 'strict');
    await assert.rejects(authenticate(copiedCookie), (error) => error.statusCode === 401);
    const revokedSession = await Session.findById(authenticated.authSession._id);
    assert.ok(revokedSession.revokedAt instanceof Date);
  });
});
