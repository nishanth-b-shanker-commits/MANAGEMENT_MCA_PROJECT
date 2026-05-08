const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['System Administrator', 'Ship Agent Account', 'Port Authority Node', 'Customs Department', 'Health Department'],
        required: true 
    },
    twoFactorSecret: { type: String }, // Used for 2FA
    is2FAEnabled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
