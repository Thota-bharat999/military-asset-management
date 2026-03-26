const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createAuditLog } = require('../middleware/auditLogger');

// @route GET /api/assignments
router.get('/', protect, async (req, res) => {
  try {
    const { baseId, startDate, endDate, assetType, isExpended, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) filter.baseId = userBase;
    } else if (baseId) {
      filter.baseId = baseId;
    }

    if (assetType) filter.assetType = assetType;
    if (isExpended !== undefined && isExpended !== '') filter.isExpended = isExpended === 'true';

    if (startDate || endDate) {
      filter.assignmentDate = {};
      if (startDate) filter.assignmentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.assignmentDate.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter)
      .populate('baseId', 'name code')
      .populate('createdBy', 'username name')
      .sort('-assignmentDate')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ assignments, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route POST /api/assignments
router.post('/', protect, authorize('admin', 'base_commander'), async (req, res) => {
  try {
    const { assetName, assetType, quantity, baseId, assignedTo, assignmentDate, notes } = req.body;

    if (!assetName || !assetType || !quantity || !baseId || !assignedTo)
      return res.status(400).json({ message: 'assetName, assetType, quantity, baseId, assignedTo are required' });

    if (req.user.role !== 'admin' && req.user.baseId) {
      const userBase = (req.user.baseId._id || req.user.baseId).toString();
      if (userBase !== baseId) {
        return res.status(403).json({ message: 'You can only create assignments for your own base' });
      }
    }

    const assignment = await Assignment.create({
      assetName, assetType, quantity, baseId, assignedTo,
      assignmentDate: assignmentDate || new Date(),
      notes, isExpended: false,
      createdBy: req.user._id,
    });

    await createAuditLog({
      action: 'CREATE_ASSIGNMENT', entity: 'Assignment', entityId: assignment._id,
      user: req.user, details: { assetName, assetType, quantity, baseId, assignedTo }, ipAddress: req.ip,
    });

    const populated = await assignment.populate(['baseId', 'createdBy']);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route PATCH /api/assignments/:id/expend  – mark as expended
router.patch('/:id/expend', protect, authorize('admin', 'base_commander'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (assignment.isExpended)
      return res.status(400).json({ message: 'Assignment is already expended' });

    // non-admin can only expend their own base's assignments
    if (req.user.role !== 'admin' && req.user.baseId) {
      const userBase = (req.user.baseId._id || req.user.baseId).toString();
      if (assignment.baseId.toString() !== userBase) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    assignment.isExpended = true;
    assignment.expendedDate = new Date();
    await assignment.save();

    await createAuditLog({
      action: 'EXPEND_ASSIGNMENT', entity: 'Assignment', entityId: assignment._id,
      user: req.user, details: { assetName: assignment.assetName, quantity: assignment.quantity }, ipAddress: req.ip,
    });

    const populated = await assignment.populate(['baseId', 'createdBy']);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route DELETE /api/assignments/:id (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    await createAuditLog({
      action: 'DELETE_ASSIGNMENT', entity: 'Assignment', entityId: req.params.id,
      user: req.user, details: { id: req.params.id }, ipAddress: req.ip,
    });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
