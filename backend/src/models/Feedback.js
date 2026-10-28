import mongoose from 'mongoose';
const feedbackSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, rating: { type: Number, min: 1, max: 5, required: true }, message: { type: String, trim: true, minlength: 3, maxlength: 2000, required: true } }, { timestamps: true });
export default mongoose.model('Feedback', feedbackSchema);
