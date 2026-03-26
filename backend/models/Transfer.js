const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  assetName: { type: String, required: true, trim: true },
  assetType: {
    type: String,
    enum: ['vehicle', 'weapon', 'ammunition', 'equipment'],
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  fromBase: { type: mongoose.Schema.Types.ObjectId, ref: 'Base', required: true },
  toBase: { type: mongoose.Schema.Types.ObjectId, ref: 'Base', required: true },
  transferDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Transfer', transferSchema);
