const express = require('express');
const router = express.Router();
const Transfer = require('../models/Transfer');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createAuditLog } = require('../middleware/auditLogger');

// @route GET /api/transfers
router.get('/', protect, async (req, res) => {
  try {
    const { baseId, startDate, endDate, assetType, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) {
        filter.$or = [{ fromBase: userBase }, { toBase: userBase }];
      }
    } else if (baseId) {
      filter.$or = [{ fromBase: baseId }, { toBase: baseId }];
    }

    if (assetType) filter.assetType = assetType;

    if (startDate || endDate) {
      filter.transferDate = {};
      if (startDate) filter.transferDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.transferDate.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Transfer.countDocuments(filter);
    const transfers = await Transfer.find(filter)
      .populate('fromBase', 'name code')
      .populate('toBase', 'name code')
      .populate('createdBy', 'username name')
      .sort('-transferDate')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ transfers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route POST /api/transfers
router.post('/', protect, authorize('admin', 'base_commander', 'logistics_officer'), async (req, res) => {
  try {
    const { assetName, assetType, quantity, fromBase, toBase, transferDate, notes } = req.body;

    if (!assetName || !assetType || !quantity || !fromBase || !toBase)
      return res.status(400).json({ message: 'assetName, assetType, quantity, fromBase, toBase are required' });

    if (fromBase === toBase)
      return res.status(400).json({ message: 'From base and To base must be different' });

    // Non-admin can only initiate from their own base
    if (req.user.role !== 'admin' && req.user.baseId) {
      const userBase = (req.user.baseId._id || req.user.baseId).toString();
      if (userBase !== fromBase) {
        return res.status(403).json({ message: 'You can only initiate transfers from your own base' });
      }
    }

    const transfer = await Transfer.create({
      assetName, assetType, quantity, fromBase, toBase,
      transferDate: transferDate || new Date(),
      notes, status: 'completed',
      createdBy: req.user._id,
    });

    await createAuditLog({
      action: 'CREATE_TRANSFER', entity: 'Transfer', entityId: transfer._id,
      user: req.user,
      details: { assetName, assetType, quantity, fromBase, toBase },
      ipAddress: req.ip,
    });

    const populated = await transfer.populate(['fromBase', 'toBase', 'createdBy']);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route DELETE /api/transfers/:id (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const transfer = await Transfer.findByIdAndDelete(req.params.id);
    if (!transfer) return res.status(404).json({ message: 'Transfer not found' });
    await createAuditLog({
      action: 'DELETE_TRANSFER', entity: 'Transfer', entityId: req.params.id,
      user: req.user, details: { id: req.params.id }, ipAddress: req.ip,
    });
    res.json({ message: 'Transfer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
