const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  assetName: { type: String, required: true, trim: true },
  assetType: {
    type: String,
    enum: ['vehicle', 'weapon', 'ammunition', 'equipment'],
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  baseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Base', required: true },
  purchaseDate: { type: Date, default: Date.now },
  supplier: { type: String, default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
