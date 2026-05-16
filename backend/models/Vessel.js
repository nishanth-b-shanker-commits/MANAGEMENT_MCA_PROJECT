const mongoose = require('mongoose');

const VesselSchema = new mongoose.Schema({
    name: { type: String, required: true },
    imoNumber: { type: String, required: true },
    flagState: { type: String, required: true },
    vesselType: { type: String, required: true },
    ownerDetails: { type: String, required: true }
});

module.exports = mongoose.model('Vessel', VesselSchema);
