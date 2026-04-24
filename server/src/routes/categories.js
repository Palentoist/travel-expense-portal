const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// GET /api/categories — all categories with limits
router.get('/', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ categories: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
