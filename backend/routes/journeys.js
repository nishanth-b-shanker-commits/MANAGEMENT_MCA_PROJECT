const express = require('express');
const Journey = require('../models/Journey');
const jwt = require('jsonwebtoken');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nmpa_super_secret_key_2024';

// Middleware to authenticate
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

// Create a new journey (Clearance Application)
router.post('/', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'Ship Agent Account') {
            return res.status(403).json({ error: 'Only Ship Agents can submit journeys' });
        }
        const { vesselId, lastPortOfCall, eta, etd } = req.body;
        const journey = new Journey({
            vessel: vesselId, lastPortOfCall, eta, etd, submittedBy: req.user.id,
            status: 'Under Review'
        });
        await journey.save();
        res.status(201).json(journey);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all journeys
router.get('/', authenticate, async (req, res) => {
    try {
        let journeys = await Journey.find({}).populate('vessel');
        res.json(journeys);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Clearance Status (Authorities)
router.put('/:id/clearance', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved' or 'Rejected'
        const role = req.user.role;
        
        const journey = await Journey.findById(id);
        if (!journey) return res.status(404).json({ error: 'Journey not found' });

        if (role === 'Health Department') journey.clearances.health = status;
        else if (role === 'Customs Department') journey.clearances.customs = status;
        else if (role === 'Port Authority Node') journey.clearances.traffic = status;
        else return res.status(403).json({ error: 'Unauthorized role for clearance' });

        // Check if all approved
        if (journey.clearances.health === 'Approved' && 
            journey.clearances.customs === 'Approved' && 
            journey.clearances.traffic === 'Approved') {
            journey.status = 'Cleared';
        } else if (status === 'Rejected') {
            journey.status = 'Rejected';
        }

        await journey.save();
        res.json(journey);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
