import test from 'node:test';
import assert from 'node:assert/strict';
import { complaintStatuses as backendStatuses, canTransitionComplaintStatus } from '../src/utils/complaintRules.js';
import { canManageComplaints, complaintStatuses, getAllowedStatusTransitions } from '../../frontend/src/utils/complaintStatus.js';
import { getSidebarMenuItems } from '../../frontend/src/utils/navigation.js';
import { updateStatusAndRefresh } from '../../frontend/src/services/complaintService.js';

test('staff controls are available only to supported staff and admin roles', () => {
  assert.equal(canManageComplaints('student'), false);
  assert.equal(canManageComplaints(undefined), false);
  assert.equal(canManageComplaints('staff'), true);
  assert.equal(canManageComplaints('admin'), true);
  assert.equal(getSidebarMenuItems('student').some((item) => item.id === 'staff-complaints'), false);
  assert.equal(getSidebarMenuItems('staff').some((item) => item.id === 'staff-complaints'), true);
  assert.equal(getSidebarMenuItems('admin').some((item) => item.id === 'staff-complaints'), true);
});

test('frontend status choices match backend statuses and allowed transitions', () => {
  assert.deepEqual(complaintStatuses, backendStatuses);
  for (const currentStatus of backendStatuses) {
    const backendTransitions = backendStatuses.filter((nextStatus) => (
      nextStatus !== currentStatus && canTransitionComplaintStatus(currentStatus, nextStatus)
    ));
    assert.deepEqual(getAllowedStatusTransitions(currentStatus), backendTransitions, currentStatus);
  }
});

test('status update uses the staff endpoint with credentialed PATCH then reloads complaint history', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const requests = [];
  const savedComplaint = { _id: 'complaint-1', status: 'Acknowledged', statusHistory: [{ status: 'Submitted' }, { status: 'Acknowledged' }] };
  const refreshedComplaint = { ...savedComplaint, statusHistory: [...savedComplaint.statusHistory, { status: 'In Progress' }] };
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    const payload = requests.length === 1 ? savedComplaint : refreshedComplaint;
    return new Response(JSON.stringify({ success: true, data: { complaint: payload } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const result = await updateStatusAndRefresh('complaint-1', { status: 'Acknowledged', note: 'Reviewed.' });
  assert.equal(result.refreshed, true);
  assert.deepEqual(result.complaint, refreshedComplaint);
  assert.equal(requests[0].url.endsWith('/staff/complaints/complaint-1/status'), true);
  assert.equal(requests[0].options.method, 'PATCH');
  assert.equal(requests[0].options.credentials, 'include');
  assert.deepEqual(JSON.parse(requests[0].options.body), { status: 'Acknowledged', note: 'Reviewed.' });
  assert.equal(requests[1].url.endsWith('/complaints/complaint-1'), true);
  assert.equal(requests[1].options.method, 'GET');
  assert.equal(requests[1].options.credentials, 'include');
});

test('status update exposes authorization, validation, and network errors', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  for (const { status, code } of [
    { status: 403, code: 'FORBIDDEN' },
    { status: 400, code: 'INVALID_STATUS_TRANSITION' },
  ]) {
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: { code, message: code } }), { status });
    await assert.rejects(updateStatusAndRefresh('complaint-1', { status: 'Resolved' }), (error) => error.status === status && error.code === code);
  }
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  await assert.rejects(updateStatusAndRefresh('complaint-1', { status: 'Acknowledged' }), (error) => error.code === 'NETWORK_ERROR');
});

test('a saved status is retained and refresh failure is reported for the UI to display', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const savedComplaint = { _id: 'complaint-1', status: 'Acknowledged', statusHistory: [{ status: 'Submitted' }, { status: 'Acknowledged' }] };
  let callCount = 0;
  globalThis.fetch = async () => {
    callCount += 1;
    if (callCount === 1) return new Response(JSON.stringify({ success: true, data: { complaint: savedComplaint } }), { status: 200 });
    throw new TypeError('offline after saving');
  };

  const result = await updateStatusAndRefresh('complaint-1', { status: 'Acknowledged' });
  assert.deepEqual(result.complaint, savedComplaint);
  assert.equal(result.refreshed, false);
  assert.equal(result.refreshError.code, 'NETWORK_ERROR');
});
