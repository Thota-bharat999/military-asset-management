const AuditLog = require('../models/AuditLog');

/**
 * Creates an audit log entry.
 * @param {Object} params
 * @param {string} params.action - Action string e.g. 'CREATE_PURCHASE'
 * @param {string} params.entity - Entity name e.g. 'Purchase'
 * @param {ObjectId} params.entityId - ID of created/modified document
 * @param {Object} params.user - req.user object
 * @param {Object} params.details - Additional context
 * @param {string} params.ipAddress - Client IP
 */
const createAuditLog = async ({ action, entity, entityId, user, details = {}, ipAddress = '' }) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId: entityId || null,
      performedBy: user._id,
      performedByUsername: user.username,
      role: user.role,
      baseId: user.baseId ? (user.baseId._id || user.baseId) : null,
      details,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('❌ Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
