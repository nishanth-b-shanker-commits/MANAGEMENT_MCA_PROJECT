const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        // Mock authentication for demonstration
        if (username === 'admin' && password === 'admin') {
            const token = jwt.sign({ id: '1', role: role || 'System Administrator' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
            return res.json({ token, user: { username, role: role || 'System Administrator' } });
        }
        res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
