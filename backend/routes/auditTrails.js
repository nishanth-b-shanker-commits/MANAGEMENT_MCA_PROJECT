const express = require('express');
const router = express.Router();
const AuditTrail = require('../models/AuditTrail');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    if (req.user.role !== 'System Administrator' && req.user.role !== 'Port Authority Node') return res.status(403).json({ error: 'Forbidden' });
    try {
        const logs = await AuditTrail.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
