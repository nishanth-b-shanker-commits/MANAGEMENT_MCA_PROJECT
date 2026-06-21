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

router.get('/nmpa-live-berths', async (req, res) => {
    try {
        const liveBerths = [
            { id: 1, name: "Berth No. 1 (General Cargo)", occupied: true, vessel: "MV Mangalore Star", flag: "IN", grt: 18450, status: "Cleared - Docked" },
            { id: 2, name: "Berth No. 2 (General / Acid Terminal)", occupied: true, vessel: "MT Swarna Krishna", flag: "IN", grt: 22100, status: "Cleared - Docked" },
            { id: 3, name: "Berth No. 3 (General Cargo)", occupied: true, vessel: "MV Star Bright", flag: "PA", grt: 15400, status: "Cleared - Docked" },
            { id: 4, name: "Berth No. 4 (General Cargo)", occupied: false, vessel: "", flag: "", grt: 0, status: "Available" },
            { id: 5, name: "Berth No. 5 (General Cargo)", occupied: true, vessel: "MV Sagar Deep", flag: "IN", grt: 34500, status: "Cleared - Docked" },
            { id: 6, name: "Berth No. 6 (General Cargo)", occupied: false, vessel: "", flag: "", grt: 0, status: "Available" },
            { id: 7, name: "Berth No. 7 (Liquid POL / Oil Jetty)", occupied: true, vessel: "MT Ocean Grace", flag: "SG", grt: 42100, status: "Cleared - Docked" },
            { id: 8, name: "Berth No. 8 (Mechanized Coal Quay)", occupied: true, vessel: "MV Aravali", flag: "IN", grt: 48900, status: "Cleared - Docked" },
            { id: 9, name: "Berth No. 9 (Container Quay Terminal)", occupied: true, vessel: "MV Express Kaveri", flag: "IN", grt: 28400, status: "Cleared - Docked" },
            { id: 10, name: "Berth No. 10 (Dry Bulk / Coal Cargo)", occupied: true, vessel: "MV Port Master", flag: "LR", grt: 31200, status: "Cleared - Docked" },
            { id: 11, name: "Berth No. 11 (POL & Crude Jetty)", occupied: true, vessel: "MT LPG Maharaja", flag: "IN", grt: 26500, status: "Cleared - Docked" },
            { id: 12, name: "Berth No. 12 (Crude Oil Terminal)", occupied: false, vessel: "", flag: "", grt: 0, status: "Available" },
            { id: 13, name: "Berth No. 13 (POL Product Jetty)", occupied: false, vessel: "", flag: "", grt: 0, status: "Available" },
            { id: 14, name: "Berth No. 14 (Mechanized Bulk Cargo)", occupied: true, vessel: "MV Deccan Queen", flag: "IN", grt: 52100, status: "Cleared - Docked" },
            { id: 15, name: "Berth No. 15 (Deep Draft SPM)", occupied: true, vessel: "MT Swarajya", flag: "IN", grt: 85000, status: "Cleared - Docked" },
            { id: 16, name: "Berth No. 16 (Multipurpose Heavy Cargo)", occupied: true, vessel: "MV Konkan Pride", flag: "IN", grt: 19800, status: "Cleared - Docked" }
        ];

        // Introduce random shifts in occupancy to simulate live VTS syncing
        const minute = new Date().getMinutes();
        if (minute % 2 === 0) {
            liveBerths[3] = { id: 4, name: "Berth No. 4 (General Cargo)", occupied: true, vessel: "MV Malabar King", flag: "IN", grt: 14200, status: "Cleared - Docked" };
            liveBerths[11] = { id: 12, name: "Berth No. 12 (Crude Oil Terminal)", occupied: true, vessel: "MT Swarna Kamal", flag: "IN", grt: 41200, status: "Cleared - Docked" };
        }

        res.json(liveBerths);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
