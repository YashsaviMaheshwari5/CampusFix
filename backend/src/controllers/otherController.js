import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';
import Feedback from '../models/Feedback.js';
import { AppError } from '../utils/AppError.js';
import { isValidFeedback } from '../utils/feedbackRules.js';
export async function stats(req, res) {
  const match = req.user.role === 'student' ? { submittedBy: req.user._id } : {};
  const rows = await Complaint.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const totals = Object.fromEntries(rows.map((row) => [row._id, row.count]));
  res.json({ success: true, data: { total: rows.reduce((sum, row) => sum + row.count, 0), submitted: totals.Submitted || 0, acknowledged: totals.Acknowledged || 0, inProgress: totals['In Progress'] || 0, resolved: totals.Resolved || 0, rejected: totals.Rejected || 0 } });
}
export async function notifications(req, res) { const rows = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100); res.json({ success: true, data: { notifications: rows } }); }
export async function readNotification(req, res) { const row = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { readAt: new Date() }, { new: true }); if (!row) throw new AppError('Notification was not found.', 404, 'NOT_FOUND'); res.json({ success: true, data: { notification: row } }); }
export async function readAllNotifications(req, res) { const result = await Notification.updateMany({ user: req.user._id, readAt: null }, { readAt: new Date() }); res.json({ success: true, data: { updated: result.modifiedCount } }); }
export async function createFeedback(req, res) { const { rating, message } = req.body || {}; if (!isValidFeedback(rating, message)) throw new AppError('Select a rating and enter 3–2000 characters of feedback.', 400, 'VALIDATION_ERROR'); const feedback = await Feedback.create({ user: req.user._id, rating, message: message.trim() }); res.status(201).json({ success: true, data: { feedback } }); }
export async function feedbackList(req, res) { const items = await Feedback.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50); res.json({ success: true, data: { feedback: items } }); }
