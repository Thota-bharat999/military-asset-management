const express = require('express');
const router = express.Router();
const Base = require('../models/Base');
const Purchase = require('../models/Purchase');
const Transfer = require('../models/Transfer');
const Assignment = require('../models/Assignment');
const { protect } = require('../middleware/auth');

// Helper to build base filter from user role
const buildBaseFilter = (user, baseId) => {
  if (user.role === 'admin') {
    return baseId ? { baseId } : {};
  }
  const userBase = user.baseId ? (user.baseId._id || user.baseId).toString() : null;
  return userBase ? { baseId: userBase } : {};
};

// Helper to build date filter
const buildDateFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter[field].$lte = end;
    }
  }
  return filter;
};

// @route GET /api/dashboard
// Returns: openingBalance, purchases, transferIn, transferOut, netMovement, closingBalance, assigned, expended
router.get('/', protect, async (req, res) => {
  try {
    const { baseId, startDate, endDate, assetType } = req.query;

    // Resolve which base(s) to query
    let baseFilter = {};
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) baseFilter = { baseId: userBase };
    } else if (baseId) {
      baseFilter = { baseId };
    }

    const assetTypeFilter = assetType ? { assetType } : {};
    const dateFilter = buildDateFilter(startDate, endDate, 'createdAt');

    const combinedFilter = { ...baseFilter, ...assetTypeFilter, ...dateFilter };

    // Purchases total
    const purchasesAgg = await Purchase.aggregate([
      { $match: combinedFilter },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const purchasesQty = purchasesAgg[0]?.total || 0;

    // Transfers IN (toBase matches)
    const transferInFilter = { ...assetTypeFilter, ...buildDateFilter(startDate, endDate, 'createdAt') };
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) transferInFilter.toBase = userBase;
    } else if (baseId) {
      transferInFilter.toBase = baseId;
    }
    const transferInAgg = await Transfer.aggregate([
      { $match: transferInFilter },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const transferInQty = transferInAgg[0]?.total || 0;

    // Transfers OUT (fromBase matches)
    const transferOutFilter = { ...assetTypeFilter, ...buildDateFilter(startDate, endDate, 'createdAt') };
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) transferOutFilter.fromBase = userBase;
    } else if (baseId) {
      transferOutFilter.fromBase = baseId;
    }
    const transferOutAgg = await Transfer.aggregate([
      { $match: transferOutFilter },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const transferOutQty = transferOutAgg[0]?.total || 0;

    // Assigned (not expended)
    const assignedAgg = await Assignment.aggregate([
      { $match: { ...combinedFilter, isExpended: false } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const assignedQty = assignedAgg[0]?.total || 0;

    // Expended
    const expendedAgg = await Assignment.aggregate([
      { $match: { ...combinedFilter, isExpended: true } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const expendedQty = expendedAgg[0]?.total || 0;

    const netMovement = purchasesQty + transferInQty - transferOutQty;
    // Opening balance = closingBalance - netMovement (simplified: total inventory baseline)
    const openingBalance = 1000; // seed/static for demonstration
    const closingBalance = openingBalance + netMovement;

    res.json({
      openingBalance,
      closingBalance,
      netMovement,
      purchases: purchasesQty,
      transferIn: transferInQty,
      transferOut: transferOutQty,
      assigned: assignedQty,
      expended: expendedQty,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route GET /api/dashboard/net-movement-detail
// Returns breakdown of purchases, transferIn, transferOut records for the modal
router.get('/net-movement-detail', protect, async (req, res) => {
  try {
    const { baseId, startDate, endDate, assetType } = req.query;

    let baseFilter = {};
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) baseFilter = { baseId: userBase };
    } else if (baseId) {
      baseFilter = { baseId };
    }

    const assetTypeFilter = assetType ? { assetType } : {};
    const dateFilter = buildDateFilter(startDate, endDate, 'createdAt');
    const combinedFilter = { ...baseFilter, ...assetTypeFilter, ...dateFilter };

    const purchases = await Purchase.find(combinedFilter)
      .populate('baseId', 'name code')
      .populate('createdBy', 'username name')
      .sort('-purchaseDate')
      .limit(50);

    // Transfer IN
    const transferInFilter = { ...assetTypeFilter, ...buildDateFilter(startDate, endDate, 'createdAt') };
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) transferInFilter.toBase = userBase;
    } else if (baseId) {
      transferInFilter.toBase = baseId;
    }
    const transfersIn = await Transfer.find(transferInFilter)
      .populate('fromBase', 'name code')
      .populate('toBase', 'name code')
      .populate('createdBy', 'username name')
      .sort('-transferDate')
      .limit(50);

    // Transfer OUT
    const transferOutFilter = { ...assetTypeFilter, ...buildDateFilter(startDate, endDate, 'createdAt') };
    if (req.user.role !== 'admin') {
      const userBase = req.user.baseId ? (req.user.baseId._id || req.user.baseId).toString() : null;
      if (userBase) transferOutFilter.fromBase = userBase;
    } else if (baseId) {
      transferOutFilter.fromBase = baseId;
    }
    const transfersOut = await Transfer.find(transferOutFilter)
      .populate('fromBase', 'name code')
      .populate('toBase', 'name code')
      .populate('createdBy', 'username name')
      .sort('-transferDate')
      .limit(50);

    res.json({ purchases, transfersIn, transfersOut });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
