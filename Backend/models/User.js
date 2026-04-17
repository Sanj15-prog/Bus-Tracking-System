const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String }, // optional for login
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Admin', 'Driver'], required: true },
  assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  preferredRoute: { type: String },
  accountStatus: { type: String, enum: ['Active', 'Pending'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
