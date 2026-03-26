const express = require('express');
const router = express.Router();
const Base = require('../models/Base');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// @route GET /api/bases
router.get('/', protect, async (req, res) => {
  try {
    const bases = await Base.find().sort('name');
    res.json(bases);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route POST /api/bases (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, code, location } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'name and code are required' });
    const base = await Base.create({ name, code, location });
    res.status(201).json(base);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Base with that name or code already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
