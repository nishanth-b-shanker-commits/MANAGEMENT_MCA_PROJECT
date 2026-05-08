const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nmpa_super_secret_key_2024';

// Register User
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate 2FA Secret for all users except Admin
        let secret = '';
        let qrCodeUrl = '';
        if (role !== 'System Administrator') {
            const secretObj = speakeasy.generateSecret({ name: `NMPA Port System (${username})` });
            secret = secretObj.base32;
            qrCodeUrl = await qrcode.toDataURL(secretObj.otpauth_url);
        }

        const newUser = new User({
            username,
            password: hashedPassword,
            role,
            twoFactorSecret: secret,
            is2FAEnabled: role !== 'System Administrator'
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully', qrCodeUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Initial Login
router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const user = await User.findOne({ username, role });
        
        if (!user) return res.status(401).json({ error: 'Invalid credentials or role' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        if (user.is2FAEnabled) {
            return res.json({ requires2FA: true, userId: user._id });
        }

        // Admin login (no 2FA)
        const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify 2FA
router.post('/verify-2fa', async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await User.findById(userId);
        
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token
        });
        if (!isValid) return res.status(401).json({ error: 'Invalid 2FA token' });

        const jwtToken = jwt.sign({ id: user._id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token: jwtToken, user: { username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
