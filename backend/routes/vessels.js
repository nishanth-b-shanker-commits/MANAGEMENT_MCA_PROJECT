const express = require('express');
const Vessel = require('../models/Vessel');
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

// Register a new vessel (Ship Agent)
router.post('/', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'Ship Agent Account') {
            return res.status(403).json({ error: 'Only Ship Agents can register vessels' });
        }
        const { name, imoNumber, flagState, vesselType, ownerDetails } = req.body;
        const vessel = new Vessel({
            name, imoNumber, flagState, vesselType, ownerDetails, registeredBy: req.user.id
        });
        await vessel.save();
        res.status(201).json(vessel);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all vessels (For Dashboard/Registry)
router.get('/', authenticate, async (req, res) => {
    try {
        let vessels;
        if (req.user.role === 'Ship Agent Account') {
            vessels = await Vessel.find({ registeredBy: req.user.id });
        } else {
            vessels = await Vessel.find({});
        }
        res.json(vessels);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
