const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  assetName: { type: String, required: true, trim: true },
  assetType: {
    type: String,
    enum: ['vehicle', 'weapon', 'ammunition', 'equipment'],
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  baseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Base', required: true },
  assignedTo: { type: String, required: true, trim: true },
  assignmentDate: { type: Date, default: Date.now },
  isExpended: { type: Boolean, default: false },
  expendedDate: { type: Date, default: null },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
