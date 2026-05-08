const mongoose = require('mongoose');

const journeySchema = new mongoose.Schema({
    vessel: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', required: true },
    lastPortOfCall: { type: String, required: true },
    eta: { type: Date, required: true },
    etd: { type: Date, required: true },
    status: {
        type: String,
        enum: ['Pending Submission', 'Under Review', 'Cleared', 'Rejected', 'Queried'],
        default: 'Pending Submission'
    },
    clearances: {
        health: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        customs: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        traffic: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Journey', journeySchema);
