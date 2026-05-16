const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true, enum: ['System Administrator', 'Ship Agent Account', 'Port Authority Node', 'Customs Department', 'Health Department'] },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    twoFactorSecret: { type: String },
    is2FAEnabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', UserSchema);
