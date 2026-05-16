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
        
        user = new User({
            username,
            password: hashedPassword,
            email,
            role,
            status: 'approved',
            is2FAEnabled: false
        });
        
        await user.save();
        await AuditTrail.create({ user: req.user.username, action: `Created user ${username} (${role})` });

        res.status(201).json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    if (req.user.role !== 'System Administrator') return res.status(403).json({ error: 'Forbidden' });
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.role === 'System Administrator') {
            return res.status(403).json({ error: 'Cannot delete a System Administrator' });
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
