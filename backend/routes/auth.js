const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { createAuditLog } = require('../middleware/auditLogger');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password are required' });

  try {
    const user = await User.findOne({ username }).populate('baseId');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        baseId: user.baseId,
      },
    });
  } catch (err) {
    console.error('❌ Login error:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    username: req.user.username,
    name: req.user.name,
    role: req.user.role,
    baseId: req.user.baseId,
  });
});

module.exports = router;
