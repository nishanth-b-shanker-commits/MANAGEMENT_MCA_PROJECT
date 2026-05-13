const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nmpa_super_secret_key_2024';

const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Get all users (Admin only)
router.get('/', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'System Administrator') {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Create User
router.post('/', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'System Administrator') return res.status(403).json({ error: 'Access denied.' });
        
        const { username, password, role } = req.body;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters, include an uppercase letter, a lowercase letter, a number, and a special character.' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ error: 'User already exists. Usernames must be unique.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
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
        res.status(201).json({ message: 'User created successfully', qrCodeUrl, user: newUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Delete User
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'System Administrator') return res.status(403).json({ error: 'Access denied.' });
        if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own Administrator account.' });
        
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) return res.status(404).json({ error: 'User not found' });
        
        if (userToDelete.role === 'System Administrator') {
            return res.status(403).json({ error: 'System Administrator accounts cannot be deleted for security reasons.' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Reset 2FA
router.put('/:id/reset-2fa', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'System Administrator') return res.status(403).json({ error: 'Access denied.' });
        
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const secretObj = speakeasy.generateSecret({ name: `NMPA Port System (${user.username})` });
        user.twoFactorSecret = secretObj.base32;
        user.is2FAEnabled = true;
        await user.save();

        const qrCodeUrl = await qrcode.toDataURL(secretObj.otpauth_url);
        res.json({ message: '2FA Reset Successfully', qrCodeUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
