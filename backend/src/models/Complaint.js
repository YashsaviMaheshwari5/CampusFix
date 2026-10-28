import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({ filename: String, originalName: String, mimeType: String, size: Number }, { _id: false });
const historySchema = new mongoose.Schema({ status: { type: String, required: true }, note: { type: String, default: '' }, changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, changedAt: { type: Date, default: Date.now } });
const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 5, maxlength: 150 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
  category: { type: String, required: true, enum: ['Maintenance', 'Cleanliness', 'Electricity', 'Internet', 'Water', 'Other'] },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  priorityOrder: { type: Number, select: false, default: 1 },
  status: { type: String, enum: ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected'], default: 'Submitted' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  attachments: { type: [attachmentSchema], default: [] },
  statusHistory: { type: [historySchema], default: [] },
}, { timestamps: true });
complaintSchema.index({ title: 'text', description: 'text' });
complaintSchema.index({ status: 1, category: 1, priority: 1, createdAt: -1 });
complaintSchema.index({ priorityOrder: 1, createdAt: -1 });
complaintSchema.pre('validate', function setPriorityOrder() { this.priorityOrder = { High: 0, Medium: 1, Low: 2 }[this.priority] ?? 1; });
export default mongoose.model('Complaint', complaintSchema);
