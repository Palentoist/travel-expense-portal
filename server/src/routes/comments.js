const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

// POST /api/comments/:claimId — add a comment to a claim
router.post('/:claimId', authenticate, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { message } = req.body;
    if (!message?.trim())
      return res.status(400).json({ message: 'Comment message cannot be empty.' });

    // Verify claim exists
    const claim = await pool.query('SELECT id FROM expense_claims WHERE id = $1', [claimId]);
    if (!claim.rows.length) return res.status(404).json({ message: 'Claim not found.' });

    const { rows } = await pool.query(
      `INSERT INTO comments (claim_id, user_id, message) VALUES ($1,$2,$3)
       RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name,
                    (SELECT role FROM users WHERE id = $2) AS user_role`,
      [claimId, req.user.id, message.trim()]
    );
    res.status(201).json({ comment: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/comments/:claimId — list all comments for a claim
router.get('/:claimId', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT cm.*, u.name AS user_name, u.role AS user_role
       FROM comments cm JOIN users u ON cm.user_id = u.id
       WHERE cm.claim_id = $1 ORDER BY cm.created_at ASC`,
      [req.params.claimId]
    );
    res.json({ comments: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
