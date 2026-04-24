const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, department: user.department },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST /api/auth/register — admin or open for demo
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee', department } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length)
      return res.status(409).json({ message: 'That email is already registered.' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, department`,
      [name, email.toLowerCase(), hash, role, department ?? null]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/auth/me — validate token + return current user
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, department, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: rows[0] });
});

module.exports = router;
