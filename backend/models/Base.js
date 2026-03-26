const mongoose = require('mongoose');

const baseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  location: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Base', baseSchema);
