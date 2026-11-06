// Mongoose User schema/model account fields aur database validation define karta hai; model se CRUD queries chalti hain.
// passwordHash select:false hai, taaki password ka hash bhi normal queries me by default return na ho.
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
  preferences: { notifications: { type: Boolean, default: true } },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
