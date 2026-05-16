const mongoose = require('mongoose');

const JourneySchema = new mongoose.Schema({
    vessel: { type: Object, required: true },
    lastPortOfCall: { type: String, required: true },
    eta: { type: Date, required: true },
    etd: { type: Date, required: true },
    status: { type: String, default: 'In Progress' },
    clearances: {
        customs: { type: String, default: 'Pending' },
        health: { type: String, default: 'Pending' },
        traffic: { type: String, default: 'Pending' }
    },
    notes: {
        customs: { type: String, default: '' },
        health: { type: String, default: '' },
        traffic: { type: String, default: '' }
    },
    documents: [{ type: String }]
});

module.exports = mongoose.model('Journey', JourneySchema);
