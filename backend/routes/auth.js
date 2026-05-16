const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    try {
        const { username, password, email, role } = req.body;
        
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ error: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        user = new User({
            username,
            password: hashedPassword,
            email,
            role,
            status: 'approved',
            is2FAEnabled: false
        });
        
        await user.save();

        res.status(201).json({ 
            message: 'User registered successfully!',
            user: { _id: user._id, username: user.username, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        let { username, password, role } = req.body;
        username = username.trim();
        role = role.trim();
        
        const user = await User.findOne({ 
            username: { $regex: new RegExp('^' + username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') } 
        });
        
        if (!user) return res.status(400).json({ error: 'Invalid username or password' });
        
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });
        
        if (user.role !== role) return res.status(400).json({ error: 'Invalid role selection' });
        if (user.status !== 'approved') return res.status(401).json({ error: 'Your account is pending approval.' });

        const token = jwt.sign(
            { _id: user._id, role: user.role, username: user.username }, 
            process.env.JWT_SECRET || 'fallback_secret'
        );
        
        res.json({ token, user: { _id: user._id, username: user.username, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
