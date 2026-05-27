const express = require('express');
const router = express.Router();
const Vessel = require('../models/Vessel');
const auth = require('../middleware/auth');
const AuditTrail = require('../models/AuditTrail');

router.get('/', auth, async (req, res) => {
    try {
        const filter = req.user.role === 'Ship Agent Account' ? { userId: req.user._id } : {};
        const vessels = await Vessel.find(filter);
        res.json(vessels);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'Ship Agent Account') return res.status(403).json({ error: 'Only Ship Agents can register vessels' });
    try {
        const vessel = new Vessel({ ...req.body, userId: req.user._id });
        await vessel.save();
        await AuditTrail.create({ user: req.user.username, action: `Registered Vessel ${vessel.name}` });
        res.status(201).json(vessel);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
