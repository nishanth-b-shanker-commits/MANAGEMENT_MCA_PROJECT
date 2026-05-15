const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { 
        type: String, 
        required: function() { return this.role !== 'System Administrator'; }, 
        unique: true,
        sparse: true
    },
    role: { 
        type: String, 
        enum: ['System Administrator', 'Ship Agent Account', 'Port Authority Node', 'Customs Department', 'Health Department'],
        required: true 
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    twoFactorSecret: { type: String }, // Used for 2FA
    is2FAEnabled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
