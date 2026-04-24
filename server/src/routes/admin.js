const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/admin/dashboard — totals, overdue, categories, monthly trend
router.get('/dashboard', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const [stats, byStatus, byCategory, trend, overdue] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)                                                               AS total_claims,
          COUNT(*) FILTER (WHERE status IN ('submitted','under_review'))        AS pending_claims,
          COUNT(*) FILTER (WHERE status = 'approved')                           AS approved_claims,
          COUNT(*) FILTER (WHERE status = 'rejected')                           AS rejected_claims,
          COUNT(*) FILTER (WHERE status = 'reimbursed')                         AS reimbursed_claims,
          COALESCE(SUM(total_amount), 0)                                         AS total_amount,
          COALESCE(SUM(total_amount) FILTER (WHERE status = 'reimbursed'),     0) AS reimbursed_amount,
          COALESCE(SUM(total_amount) FILTER (
            WHERE created_at >= date_trunc('month', CURRENT_DATE)),            0) AS this_month_amount
        FROM expense_claims`),

      pool.query(`
        SELECT status,
               COUNT(*)                        AS count,
               COALESCE(SUM(total_amount), 0)   AS amount
        FROM expense_claims
        GROUP BY status`),

      pool.query(`
        SELECT c.name AS category,
               COALESCE(SUM(ei.amount), 0) AS total_amount,
               COUNT(ei.id)                AS item_count,
               c.limit_amount
        FROM categories c
        LEFT JOIN expense_items ei ON c.id = ei.category_id
        GROUP BY c.id, c.name, c.limit_amount
        ORDER BY total_amount DESC`),

      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
               COUNT(*)                                              AS count,
               COALESCE(SUM(total_amount), 0)                       AS amount
        FROM expense_claims
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)`),

      pool.query(`
        SELECT ec.*, u.name AS employee_name, u.department
        FROM expense_claims ec
        JOIN users u ON ec.employee_id = u.id
        WHERE ec.status = 'submitted'
          AND ec.created_at < NOW() - INTERVAL '5 days'
        ORDER BY ec.created_at ASC
        LIMIT 10`),
    ]);

    res.json({
      stats:             stats.rows[0],
      byStatus:          byStatus.rows,
      categoryBreakdown: byCategory.rows,
      monthlyTrend:      trend.rows,
      overdueClaims:     overdue.rows,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// GET /api/admin/users — list all users
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.created_at,
             COUNT(ec.id) AS claim_count
      FROM users u
      LEFT JOIN expense_claims ec ON u.id = ec.employee_id
      GROUP BY u.id
      ORDER BY u.created_at DESC`);
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// POST /api/admin/users — create a new user
router.post('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length)
      return res.status(409).json({ message: 'A user with that email already exists.' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, role, department, created_at`,
      [name, email.toLowerCase(), hash, role, department ?? null]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// DELETE /api/admin/users/:id — remove user
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
