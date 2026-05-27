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
    documents: [{ type: String }],
    captainName: { type: String, default: '' },
    destinationPort: { type: String, default: '' },
    cargoType: { type: String, default: 'BALLAST' },
    crewCount: { type: Number, default: 0 },
    passengerCount: { type: Number, default: 0 },
    ilhReceiptNo: { type: String, default: '' },
    ilhPaidDate: { type: Date },
    ilhAmount: { type: Number, default: 0 },
    ilhValidFrom: { type: Date },
    ilhValidTo: { type: Date },
    healthCertificateNo: { type: String, default: '' },
    healthClearanceDate: { type: Date },
    portClearanceNo: { type: String, default: '' },
    portClearanceDate: { type: Date },
    userId: { type: String, required: false }
});

module.exports = mongoose.model('Journey', JourneySchema);
