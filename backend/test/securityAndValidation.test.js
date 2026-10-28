import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import jwt from 'jsonwebtoken';
import { createSessionToken, durationMilliseconds, hashSessionId, sessionCookieOptions } from '../src/utils/session.js';
import { canDeleteComplaint, canEditComplaint, canTransitionComplaintStatus, canViewComplaint, isComplaintStatus } from '../src/utils/complaintRules.js';
import { isValidFeedback } from '../src/utils/feedbackRules.js';
import { isAllowedImageSignature, isAllowedImageType, MAX_IMAGE_FILES, MAX_IMAGE_SIZE } from '../src/utils/imageValidation.js';
import { notificationsEnabled } from '../src/services/notificationService.js';
import { errorHandler } from '../src/middleware/errors.js';
import { allowRoles } from '../src/middleware/auth.js';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

test('session token has a subject and role, and cookie is HttpOnly and same-site', () => {
  const secret = 'test-secret-with-at-least-32-characters';
  const session = createSessionToken({ _id: 'student-123', role: 'student' }, secret, '1h');
  assert.equal(jwt.verify(session.token, secret).sub, 'student-123');
  assert.equal(jwt.verify(session.token, secret).role, 'student');
  assert.equal(jwt.verify(session.token, secret).jti, session.tokenId);
  assert.throws(() => jwt.verify(session.token, 'another-test-secret-with-at-least-32-characters'));
  assert.notEqual(hashSessionId(session.tokenId), session.tokenId);
  assert.equal(hashSessionId(session.tokenId), hashSessionId(session.tokenId));
  assert.ok(session.expiresAt instanceof Date);
  assert.deepEqual(sessionCookieOptions(true, '1h'), { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 3_600_000 });
  assert.equal(durationMilliseconds('30m'), 1_800_000);
  assert.throws(() => durationMilliseconds('1ms'));
});

test('complaint ownership and edit/delete rules prevent cross-user access', () => {
  assert.equal(canViewComplaint('student', 'student-a', 'student-a'), true);
  assert.equal(canViewComplaint('student', 'student-a', 'student-b'), false);
  assert.equal(canViewComplaint('staff', 'staff-a', 'student-b'), true);
  assert.equal(canEditComplaint('student', 'student-a', 'student-a', 'Submitted'), true);
  assert.equal(canEditComplaint('student', 'student-a', 'student-a', 'In Progress'), false);
  assert.equal(canDeleteComplaint('student', 'student-a', 'student-b', 'Submitted'), false);
  assert.equal(canDeleteComplaint('admin', 'admin-a', 'student-b', 'Resolved'), true);
});

test('status changes and feedback validation reject invalid values', () => {
  assert.equal(isComplaintStatus('Submitted'), true);
  assert.equal(isComplaintStatus('Pending'), false);
  assert.equal(canTransitionComplaintStatus('Submitted', 'Acknowledged'), true);
  assert.equal(canTransitionComplaintStatus('Resolved', 'Submitted'), false);
  assert.equal(isValidFeedback(5, 'Useful and clear'), true);
  assert.equal(isValidFeedback(6, 'Useful and clear'), false);
  assert.equal(isValidFeedback(3, 'ok'), false);
});

test('image validation requires matching supported image signatures', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  assert.equal(isAllowedImageSignature(png, 'image/png'), true);
  assert.equal(isAllowedImageSignature(png, 'image/jpeg'), false);
  assert.equal(isAllowedImageSignature(Buffer.from('<svg>bad</svg>'), 'image/svg+xml'), false);
  assert.equal(isAllowedImageType('picture.png', 'image/png'), true);
  assert.equal(isAllowedImageType('picture.svg', 'image/svg+xml'), false);
  assert.equal(MAX_IMAGE_SIZE, 5 * 1024 * 1024);
  assert.equal(MAX_IMAGE_FILES, 3);
});

test('notification preference defaults to enabled and honors an explicit opt-out', () => {
  assert.equal(notificationsEnabled(undefined), true);
  assert.equal(notificationsEnabled({ notifications: true }), true);
  assert.equal(notificationsEnabled({ notifications: false }), false);
});

test('central error middleware reports malformed JSON as a client error', () => {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  errorHandler({ type: 'entity.parse.failed', message: 'invalid json' }, {}, response, () => {});
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, 'INVALID_JSON');
});

test('password hashes are not plaintext and can be verified', async () => {
  const hash = await hashPassword('campusfix-safe-password');
  assert.notEqual(hash, 'campusfix-safe-password');
  assert.equal(await verifyPassword('campusfix-safe-password', hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('role middleware blocks unauthorized users and allows the required role', () => {
  let nextError;
  allowRoles('staff', 'admin')({ user: { role: 'student' } }, {}, (error) => { nextError = error; });
  assert.equal(nextError.statusCode, 403);
  let passed = false;
  allowRoles('staff', 'admin')({ user: { role: 'staff' } }, {}, (error) => { assert.equal(error, undefined); passed = true; });
  assert.equal(passed, true);
});
