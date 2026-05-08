const mongoose = require('mongoose');

const vesselSchema = new mongoose.Schema({
    name: { type: String, required: true },
    imoNumber: { type: String, required: true, unique: true },
    flagState: { type: String, required: true },
    vesselType: { type: String, required: true },
    ownerDetails: { type: String },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Vessel', vesselSchema);
