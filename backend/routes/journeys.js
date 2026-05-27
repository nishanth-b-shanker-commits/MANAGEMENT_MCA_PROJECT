const express = require('express');
const router = express.Router();
const Journey = require('../models/Journey');
const Vessel = require('../models/Vessel');
const auth = require('../middleware/auth');
const AuditTrail = require('../models/AuditTrail');

router.get('/', auth, async (req, res) => {
    try {
        const filter = req.user.role === 'Ship Agent Account' ? { userId: req.user._id } : {};
        const journeys = await Journey.find(filter);
        res.json(journeys);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'Ship Agent Account') return res.status(403).json({ error: 'Only Ship Agents can apply for clearance' });
    try {
        const vessel = await Vessel.findById(req.body.vesselId);
        if (!vessel) return res.status(404).json({ error: 'Vessel not found' });
        
        const journey = new Journey({
            ...req.body,
            vessel: vessel,
            userId: req.user._id,
            documents: req.body.documents || ['Registry_Copy.pdf', 'Manifest.pdf']
        });
        await journey.save();
        await AuditTrail.create({ user: req.user.username, action: `New Journey Registry: ${vessel.name}` });
        res.status(201).json(journey);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/clearance', auth, async (req, res) => {
    try {
        const journey = await Journey.findById(req.params.id);
        if (!journey) return res.status(404).json({ error: 'Journey not found' });

        const { status, note } = req.body;

        if (req.user.role === 'Customs Department') {
            journey.clearances.customs = status;
            journey.notes.customs = note || '';
        } else if (req.user.role === 'Health Department') {
            journey.clearances.health = status;
            journey.notes.health = note || '';
            if (status === 'Approved' && !journey.healthCertificateNo) {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
                journey.healthCertificateNo = `PH ${year}${month}${day}${randomDigits} /HC/${year}`;
                journey.healthClearanceDate = now;
            }
        } else if (req.user.role === 'Port Authority Node') {
            journey.clearances.traffic = status;
            journey.notes.traffic = note || '';
        } else {
            return res.status(403).json({ error: 'Unauthorized role' });
        }

        const c = journey.clearances;
        if (c.customs === 'Rejected' || c.health === 'Rejected' || c.traffic === 'Rejected') {
            journey.status = 'Rejected';
        } else if (c.customs === 'Approved' && c.health === 'Approved' && c.traffic === 'Approved') {
            journey.status = 'Cleared';
            if (!journey.portClearanceNo) {
                const now = new Date();
                const year = now.getFullYear();
                const randomNum = Math.floor(Math.random() * 900) + 100;
                journey.portClearanceNo = `E.No.${randomNum} /${year}`;
                journey.portClearanceDate = now;
            }
        } else {
            journey.status = 'In Progress';
        }

        await journey.save();
        await AuditTrail.create({ user: req.user.username, action: `Updated clearance (${req.user.role}) for ${journey.vessel.name} to ${status}` });
        
        res.json(journey);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
