import Complaint from '../models/Complaint.js';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { AppError } from '../utils/AppError.js';
import { publishAppEvent } from '../services/notificationService.js';
import { isComplaintStatus, canTransitionComplaintStatus, canViewComplaint, canEditComplaint, canDeleteComplaint, complaintStatuses } from '../utils/complaintRules.js';
import { uploadDirectory } from '../utils/uploadDirectory.js';

const plain = (doc) => doc.toObject({ versionKey: false });
async function cleanupUploadedFiles(files = []) { await Promise.allSettled(files.map((file) => unlink(file.path))); }
export async function list(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
  const filter = req.user.role === 'student' ? { submittedBy: req.user._id } : {};
  const queryEnums = { status: complaintStatuses, category: ['Maintenance', 'Cleanliness', 'Electricity', 'Internet', 'Water', 'Other'], priority: ['Low', 'Medium', 'High'] };
  for (const [key, values] of Object.entries(queryEnums)) if (req.query[key]) {
    if (!values.includes(String(req.query[key]))) throw new AppError(`Choose a valid ${key} filter.`, 400, 'VALIDATION_ERROR');
    filter[key] = req.query[key];
  }
  if (req.query.search) filter.$text = { $search: String(req.query.search).slice(0, 100) };
  const sort = req.query.sort === 'priority' ? { priorityOrder: 1, createdAt: -1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([Complaint.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate('submittedBy', 'name email'), Complaint.countDocuments(filter)]);
  res.json({ success: true, data: { complaints: items.map(plain), pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
}
export async function getOne(req, res) {
  const item = await Complaint.findById(req.params.id).populate('submittedBy', 'name email').populate('statusHistory.changedBy', 'name role');
  if (!item) throw new AppError('Complaint was not found.', 404, 'NOT_FOUND');
  if (!canViewComplaint(req.user.role, req.user._id, item.submittedBy._id)) throw new AppError('You do not have access to this complaint.', 403, 'FORBIDDEN');
  res.json({ success: true, data: { complaint: plain(item) } });
}
export async function getAttachment(req, res, next) {
  const complaint = await Complaint.findById(req.params.id).select('submittedBy attachments');
  if (!complaint) throw new AppError('Complaint was not found.', 404, 'NOT_FOUND');
  if (!canViewComplaint(req.user.role, req.user._id, complaint.submittedBy)) throw new AppError('You do not have access to this attachment.', 403, 'FORBIDDEN');
  const attachment = complaint.attachments.find((item) => item.filename === req.params.filename);
  if (!attachment || path.basename(attachment.filename) !== attachment.filename) throw new AppError('Attachment was not found.', 404, 'NOT_FOUND');
  res.type(attachment.mimeType);
  res.sendFile(path.resolve(uploadDirectory, attachment.filename), (error) => {
    if (error) next(error.code === 'ENOENT' ? new AppError('Attachment file is no longer available.', 404, 'NOT_FOUND') : error);
  });
}
export async function create(req, res) {
  const { title, description, category, location, priority } = req.body || {};
  if ([title, description, category, location, priority].some((value) => typeof value !== 'string' || !value.trim())) {
    await cleanupUploadedFiles(req.files);
    throw new AppError('Complete all required complaint fields.', 400, 'VALIDATION_ERROR');
  }
  let complaint;
  try {
    complaint = await Complaint.create({ title, description, category, location, priority, submittedBy: req.user._id, attachments: (req.files || []).map((file) => ({ filename: file.filename, originalName: file.originalname, mimeType: file.mimetype, size: file.size })), statusHistory: [{ status: 'Submitted', changedBy: req.user._id, note: 'Complaint submitted.' }] });
  } catch (error) { await cleanupUploadedFiles(req.files); throw error; }
  await publishAppEvent('complaint:created', { complaint: plain(complaint) });
  res.status(201).json({ success: true, data: { complaint: plain(complaint) } });
}
export async function update(req, res) {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError('Complaint was not found.', 404, 'NOT_FOUND');
  const privileged = ['staff', 'admin'].includes(req.user.role);
  let statusChanged = false;
  if (!canViewComplaint(req.user.role, req.user._id, complaint.submittedBy)) throw new AppError('You do not have access to this complaint.', 403, 'FORBIDDEN');
  const { status, note, title, description, category, location, priority } = req.body || {};
  if (privileged && status !== undefined) {
    if (!isComplaintStatus(status)) throw new AppError('Choose a valid status.', 400, 'VALIDATION_ERROR');
    if (!canTransitionComplaintStatus(complaint.status, status)) throw new AppError(`A complaint cannot move from ${complaint.status} to ${status}.`, 400, 'INVALID_STATUS_TRANSITION');
    if (status !== complaint.status) { complaint.status = status; complaint.statusHistory.push({ status, changedBy: req.user._id, note: typeof note === 'string' ? note.slice(0, 500) : '' }); statusChanged = true; }
  } else if (status !== undefined) throw new AppError('Only staff can change complaint status.', 403, 'FORBIDDEN');
  if (!canEditComplaint(req.user.role, req.user._id, complaint.submittedBy, complaint.status)) throw new AppError('This complaint can no longer be edited.', 403, 'FORBIDDEN');
  for (const [key, value] of Object.entries({ title, description, category, location, priority })) if (value !== undefined) complaint[key] = value;
  await complaint.save();
  if (statusChanged) await publishAppEvent('complaint:statusChanged', { complaint: plain(complaint), status });
  res.json({ success: true, data: { complaint: plain(complaint) } });
}
export async function remove(req, res) {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError('Complaint was not found.', 404, 'NOT_FOUND');
  if (!canDeleteComplaint(req.user.role, req.user._id, complaint.submittedBy, complaint.status)) throw new AppError('You cannot delete this complaint.', 403, 'FORBIDDEN');
  await complaint.deleteOne();
  await Promise.allSettled(complaint.attachments.filter((item) => path.basename(item.filename) === item.filename).map((item) => unlink(path.resolve(uploadDirectory, item.filename))));
  res.status(204).end();
}
