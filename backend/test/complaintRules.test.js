import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionComplaintStatus, isComplaintStatus } from '../src/utils/complaintRules.js';

test('accepts only the supported complaint statuses', () => {
  assert.equal(isComplaintStatus('Submitted'), true);
  assert.equal(isComplaintStatus('Resolved'), true);
  assert.equal(isComplaintStatus('Pending'), false);
});

test('allows valid forward status changes and rejects terminal reversals', () => {
  assert.equal(canTransitionComplaintStatus('Submitted', 'Acknowledged'), true);
  assert.equal(canTransitionComplaintStatus('Acknowledged', 'In Progress'), true);
  assert.equal(canTransitionComplaintStatus('In Progress', 'Resolved'), true);
  assert.equal(canTransitionComplaintStatus('Resolved', 'In Progress'), false);
  assert.equal(canTransitionComplaintStatus('Rejected', 'Submitted'), false);
  assert.equal(canTransitionComplaintStatus('Submitted', 'Submitted'), true);
});
