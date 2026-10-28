import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { appEvents } from '../events/appEvents.js';

const pendingTasks = new Set();
export const notificationsEnabled = (preferences) => preferences?.notifications !== false;

async function saveNotification({ complaint, title, message }) {
  const user = await User.findById(complaint.submittedBy).select('preferences');
  if (notificationsEnabled(user?.preferences)) {
    await Notification.create({ user: complaint.submittedBy, complaint: complaint._id, title, message });
  }
}

function registerNotification(eventName, buildMessage) {
  appEvents.on(eventName, (payload) => {
    const task = saveNotification({ complaint: payload.complaint, ...buildMessage(payload) })
      .catch((error) => console.error('Could not create complaint notification:', error.message));
    pendingTasks.add(task);
    task.finally(() => pendingTasks.delete(task));
  });
}

registerNotification('complaint:created', ({ complaint }) => ({
  title: 'Complaint submitted',
  message: `“${complaint.title}” was submitted and is awaiting review.`,
}));
registerNotification('complaint:statusChanged', ({ complaint, status }) => ({
  title: 'Complaint status updated',
  message: `“${complaint.title}” is now ${status}.`,
}));

export async function publishAppEvent(eventName, payload) {
  appEvents.emit(eventName, payload);
  await Promise.all([...pendingTasks]);
}
