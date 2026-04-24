const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticate, authorize } = require('../middleware/auth');

// ── GET /api/claims — paginated, filtered, role-aware ─────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search = '' } = req.query;
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * limitNum;
    const { role, id: userId } = req.user;

    const conditions = [];
    const params     = [];
    let   p          = 1;

    if (role === 'employee') {
      conditions.push(`ec.employee_id = $${p++}`);
      params.push(userId);
    }
    if (status && status !== 'all') {
      conditions.push(`ec.status = $${p++}`);
      params.push(status);
    }
    if (search.trim()) {
      conditions.push(`(ec.title ILIKE $${p} OR ec.destination ILIKE $${p} OR u.name ILIKE $${p})`);
      params.push(`%${search.trim()}%`);
      p++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM expense_claims ec
       JOIN users u ON ec.employee_id = u.id ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await pool.query(
      `SELECT ec.*,
              u.name       AS employee_name,
              u.email      AS employee_email,
              u.department,
              m.name       AS reviewer_name
       FROM expense_claims ec
       JOIN users u ON ec.employee_id = u.id
       LEFT JOIN users m ON ec.reviewed_by = m.id
       ${where}
       ORDER BY ec.created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      [...params, limitNum, offset]
    );

    res.json({
      claims: dataRes.rows,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── GET /api/claims/summary — stats for current user (or all for manager/admin) ─
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const where = role === 'employee' ? `WHERE employee_id = ${userId}` : '';

    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                                            AS total,
        COUNT(*) FILTER (WHERE status = 'submitted')                       AS submitted,
        COUNT(*) FILTER (WHERE status = 'under_review')                    AS under_review,
        COUNT(*) FILTER (WHERE status = 'approved')                        AS approved,
        COUNT(*) FILTER (WHERE status = 'rejected')                        AS rejected,
        COUNT(*) FILTER (WHERE status = 'reimbursed')                      AS reimbursed,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'reimbursed'), 0) AS total_reimbursed,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'approved'),    0) AS total_approved,
        COALESCE(SUM(total_amount) FILTER (
          WHERE status IN ('submitted','under_review')),                   0) AS total_pending
      FROM expense_claims ${where}
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── GET /api/claims/:id — detail with items & comments ────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const claimRes = await pool.query(`
      SELECT ec.*,
             u.name  AS employee_name, u.email AS employee_email, u.department,
             m.name  AS reviewer_name
      FROM expense_claims ec
      JOIN  users u ON ec.employee_id = u.id
      LEFT JOIN users m ON ec.reviewed_by = m.id
      WHERE ec.id = $1`, [id]);

    if (!claimRes.rows.length) return res.status(404).json({ message: 'Claim not found.' });

    const claim = claimRes.rows[0];
    if (role === 'employee' && claim.employee_id !== userId)
      return res.status(403).json({ message: 'Access denied.' });

    const itemsRes = await pool.query(`
      SELECT ei.*, c.name AS category_name, c.limit_amount
      FROM expense_items ei
      LEFT JOIN categories c ON ei.category_id = c.id
      WHERE ei.claim_id = $1 ORDER BY ei.created_at`, [id]);

    const commentsRes = await pool.query(`
      SELECT cm.*, u.name AS user_name, u.role AS user_role
      FROM comments cm JOIN users u ON cm.user_id = u.id
      WHERE cm.claim_id = $1 ORDER BY cm.created_at`, [id]);

    res.json({ ...claim, items: itemsRes.rows, comments: commentsRes.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── POST /api/claims — submit new claim (employee) ───────────────────────────
router.post('/', authenticate, authorize('employee'), async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, destination, trip_start, trip_end, purpose, items } = req.body;
    if (!title || !destination || !trip_start || !trip_end || !items?.length)
      return res.status(400).json({ message: 'All fields and at least one expense item are required.' });

    await client.query('BEGIN');

    const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

    const { rows: [claim] } = await client.query(`
      INSERT INTO expense_claims (employee_id, title, destination, trip_start, trip_end, purpose, total_amount)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, title, destination, trip_start, trip_end, purpose ?? null, totalAmount]
    );

    for (const item of items) {
      await client.query(
        'INSERT INTO expense_items (claim_id, category_id, description, amount) VALUES ($1,$2,$3,$4)',
        [claim.id, item.category_id, item.description ?? null, parseFloat(item.amount)]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ claim });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Server error.', error: err.message });
  } finally {
    client.release();
  }
});

// ── PATCH /api/claims/:id/status — update status (manager / admin) ───────────
router.patch('/:id/status', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const allowed = ['under_review', 'approved', 'rejected', 'reimbursed'];

    if (!allowed.includes(status))
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}.` });

    const { rows } = await pool.query(`
      UPDATE expense_claims
      SET status = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
      WHERE id = $3 RETURNING *`,
      [status, req.user.id, id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Claim not found.' });

    if (comment?.trim()) {
      await pool.query(
        'INSERT INTO comments (claim_id, user_id, message) VALUES ($1,$2,$3)',
        [id, req.user.id, comment.trim()]
      );
    }

    res.json({ claim: rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

module.exports = router;
