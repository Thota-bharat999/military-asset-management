const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { createAuditLog } = require('../middleware/auditLogger');

// @route GET /api/purchases
router.get('/', protect, async (req, res) => {
  try {
    const { baseId, startDate, endDate, assetType, page = 1, limit = 20 } = req.query;

    let filter = {};

    // Scope to own base for non-admin
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) filter.baseId = userBase;
    } else if (baseId) {
      filter.baseId = baseId;
    }

    if (assetType) filter.assetType = assetType;

    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.purchaseDate.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Purchase.countDocuments(filter);
    const purchases = await Purchase.find(filter)
      .populate('baseId', 'name code')
      .populate('createdBy', 'username name')
      .sort('-purchaseDate')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ purchases, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route POST /api/purchases
router.post('/', protect, authorize('admin', 'base_commander', 'logistics_officer'), async (req, res) => {
  try {
    const { assetName, assetType, quantity, baseId, purchaseDate, supplier, notes } = req.body;

    if (!assetName || !assetType || !quantity || !baseId)
      return res.status(400).json({ message: 'assetName, assetType, quantity, and baseId are required' });

    // Base commander / logistics officer can only purchase for their own base
    if (req.user.role !== 'admin' && req.user.baseId) {
      const userBase = (req.user.baseId._id || req.user.baseId).toString();
      if (userBase !== baseId) {
        return res.status(403).json({ message: 'You can only record purchases for your own base' });
      }
    }

    const purchase = await Purchase.create({
      assetName, assetType, quantity, baseId,
      purchaseDate: purchaseDate || new Date(),
      supplier, notes,
      createdBy: req.user._id,
    });

    await createAuditLog({
      action: 'CREATE_PURCHASE',
      entity: 'Purchase',
      entityId: purchase._id,
      user: req.user,
      details: { assetName, assetType, quantity, baseId },
      ipAddress: req.ip,
    });

    const populated = await purchase.populate(['baseId', 'createdBy']);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route DELETE /api/purchases/:id (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    await createAuditLog({
      action: 'DELETE_PURCHASE', entity: 'Purchase', entityId: req.params.id,
      user: req.user, details: { id: req.params.id }, ipAddress: req.ip,
    });
    res.json({ message: 'Purchase deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
