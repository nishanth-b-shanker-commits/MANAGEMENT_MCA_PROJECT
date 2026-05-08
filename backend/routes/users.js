const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
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
        const users = await User.find({}).select('-password -twoFactorSecret');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
