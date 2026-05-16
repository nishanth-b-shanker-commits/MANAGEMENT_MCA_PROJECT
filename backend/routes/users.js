const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const AuditTrail = require('../models/AuditTrail');

router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'System Administrator') return res.status(403).json({ error: 'Forbidden' });
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'System Administrator') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { username, password, email, role } = req.body;
        
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ error: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate valid Base32 secret for 2FA
        const base32_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let rawSecret = '';
        for(let i = 0; i < 16; i++) {
            rawSecret += base32_chars.charAt(Math.floor(Math.random() * 32));
        }

        user = new User({
            username,
            password: hashedPassword,
            email,
            role,
            status: 'approved',
            twoFactorSecret: rawSecret,
            is2FAEnabled: true
        });
        
        await user.save();
        await AuditTrail.create({ user: req.user.username, action: `Created user ${username} (${role})` });

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/PortSystem:${username}?secret=${rawSecret}&issuer=PortSystem`;

        res.status(201).json({ user, qrCodeUrl, secret: rawSecret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/reset-2fa', auth, async (req, res) => {
    try {
        // Only Admin can reset others, but users can reset themselves
        if (req.user.role !== 'System Administrator' && req.user._id !== req.params.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const base32_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let rawSecret = '';
        for(let i = 0; i < 16; i++) {
            rawSecret += base32_chars.charAt(Math.floor(Math.random() * 32));
        }

        user.twoFactorSecret = rawSecret;
        user.is2FAEnabled = true;
        await user.save();

        await AuditTrail.create({ user: req.user.username, action: `Reset 2FA for ${user.username}` });

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/PortSystem:${user.username}?secret=${rawSecret}&issuer=PortSystem`;

        res.json({ message: '2FA reset successfully', qrCodeUrl, secret: rawSecret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'System Administrator') return res.status(403).json({ error: 'Forbidden' });
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.role === 'System Administrator' && user.username === 'Admin') {
            return res.status(403).json({ error: 'Cannot delete the master System Administrator' });
        }
        
        await User.findByIdAndDelete(req.params.id);
        await AuditTrail.create({ user: req.user.username, action: `Deleted user ${user.username}` });
        
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/status', auth, async (req, res) => {
    if (req.user.role !== 'System Administrator') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        await AuditTrail.create({ user: req.user.username, action: `Updated status for ${user.username} to ${status}` });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
