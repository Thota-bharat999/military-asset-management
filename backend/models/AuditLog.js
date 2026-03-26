const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'CREATE_PURCHASE', 'CREATE_TRANSFER'
  entity: { type: String, required: true }, // e.g. 'Purchase', 'Transfer'
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  performedByUsername: { type: String, required: true },
  role: { type: String, required: true },
  baseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Base', default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);
