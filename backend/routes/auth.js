const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { TOTP } = require('totp-generator');
const crypto = require('crypto');

router.post('/register', async (req, res) => {
    try {
        const { username, password, email, role } = req.body;
        
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ error: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const is2FAEnabled = true;
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
            status: 'pending',
            twoFactorSecret: rawSecret,
            is2FAEnabled: is2FAEnabled
        });
        
        await user.save();

        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/PortSystem:${username}?secret=${rawSecret}&issuer=PortSystem`;

        res.status(201).json({ 
            message: 'User registered. Pending approval.', 
            qrCodeUrl: qrCodeUrl, 
            secret: rawSecret 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const user = await User.findOne({ username });
        
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });
        
        if (user.role !== role) return res.status(400).json({ error: 'Invalid role selection' });
        if (user.status !== 'approved') return res.status(401).json({ error: 'Your account is pending approval by the System Administrator.' });

        if (user.is2FAEnabled) {
            return res.json({ requires2FA: true, userId: user._id });
        }

        const token = jwt.sign({ _id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ token, user: { _id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/verify-2fa', async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(400).json({ error: 'User not found' });

        if (!user.twoFactorSecret) {
            return res.status(400).json({ error: '2FA is not configured for this user.' });
        }

        const { otp } = await TOTP.generate(user.twoFactorSecret);
        const isValid = otp === token;
        
        if (!isValid) return res.status(400).json({ error: 'Invalid 2FA token' });

        const jwtToken = jwt.sign({ _id: user._id, role: user.role, username: user.username }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ token: jwtToken, user: { _id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
