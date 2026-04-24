require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hash = await bcrypt.hash('password123', 10);

    // ── Users ──────────────────────────────────────────────────
    const [admin] = (await client.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ('Admin User',     'admin@portal.com',   $1, 'admin',    'IT')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id`, [hash])).rows;

    const [manager] = (await client.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ('Sarah Johnson',  'manager@portal.com', $1, 'manager',  'Finance')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id`, [hash])).rows;

    const [emp1] = (await client.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ('John Smith',    'john@portal.com',     $1, 'employee', 'Sales')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id`, [hash])).rows;

    const [emp2] = (await client.query(`
      INSERT INTO users (name, email, password_hash, role, department)
      VALUES ('Emily Davis',   'emily@portal.com',    $1, 'employee', 'Marketing')
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id`, [hash])).rows;

    // ── Category map ──────────────────────────────────────────
    const cats = (await client.query('SELECT id, name FROM categories')).rows;
    const C = Object.fromEntries(cats.map(c => [c.name, c.id]));

    // ── Helper ─────────────────────────────────────────────────
    const insertClaim = (opts) => client.query(`
      INSERT INTO expense_claims
        (employee_id, title, destination, trip_start, trip_end, purpose, total_amount, status, reviewed_by, reviewed_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [opts.emp, opts.title, opts.dest, opts.start, opts.end,
       opts.purpose, opts.total, opts.status,
       opts.reviewer ?? null, opts.reviewedAt ?? null]);

    const insertItems = (claimId, ...items) =>
      Promise.all(items.map(([cat, desc, amount]) =>
        client.query(
          'INSERT INTO expense_items (claim_id, category_id, description, amount) VALUES ($1,$2,$3,$4)',
          [claimId, C[cat], desc, amount]
        )
      ));

    const insertComment = (claimId, userId, msg) =>
      client.query('INSERT INTO comments (claim_id, user_id, message) VALUES ($1,$2,$3)', [claimId, userId, msg]);

    // ── Claim 1: Reimbursed (John) ─────────────────────────────
    const c1 = (await insertClaim({
      emp: emp1.id, title: 'Sales Conference Dubai', dest: 'Dubai, UAE',
      start: '2026-02-10', end: '2026-02-14',
      purpose: 'Annual global sales conference and client meetings',
      total: 4200, status: 'reimbursed',
      reviewer: manager.id, reviewedAt: new Date('2026-02-16'),
    })).rows[0];
    await insertItems(c1.id,
      ['Transportation',    'Round-trip flight (Economy)',   2500],
      ['Accommodation',     'Hotel – 4 nights',              1400],
      ['Meals',             'Client dinners',                 300],
    );
    await insertComment(c1.id, manager.id, 'All receipts verified. Approved for reimbursement.');

    // ── Claim 2: Approved (Emily) ──────────────────────────────
    const c2 = (await insertClaim({
      emp: emp2.id, title: 'Marketing Summit Islamabad', dest: 'Islamabad, Pakistan',
      start: '2026-03-05', end: '2026-03-07',
      purpose: 'Digital marketing summit and networking',
      total: 1600, status: 'approved',
      reviewer: manager.id, reviewedAt: new Date('2026-03-09'),
    })).rows[0];
    await insertItems(c2.id,
      ['Transportation',    'Flight tickets',               800],
      ['Accommodation',     'Hotel – 2 nights',             600],
      ['Conference/Events', 'Summit registration fee',      200],
    );
    await insertComment(c2.id, manager.id, 'Looks good — approved. Finance will process reimbursement shortly.');

    // ── Claim 3: Under Review (John) ──────────────────────────
    const c3 = (await insertClaim({
      emp: emp1.id, title: 'Client Visit Lahore', dest: 'Lahore, Pakistan',
      start: '2026-04-20', end: '2026-04-22',
      purpose: 'Client onboarding and project kick-off meetings',
      total: 850, status: 'under_review',
      reviewer: manager.id, reviewedAt: null,
    })).rows[0];
    await insertItems(c3.id,
      ['Transportation', 'Train tickets (return)',         350],
      ['Accommodation',  'Hotel – 2 nights',              500],
    );
    await insertComment(c3.id, manager.id, 'Please upload hotel receipt scans to proceed.');

    // ── Claim 4: Submitted (Emily) ─────────────────────────────
    const c4 = (await insertClaim({
      emp: emp2.id, title: 'Brand Workshop Karachi', dest: 'Karachi, Pakistan',
      start: '2026-04-25', end: '2026-04-27',
      purpose: 'Brand strategy workshop with agency',
      total: 2100, status: 'submitted',
      reviewer: null, reviewedAt: null,
    })).rows[0];
    await insertItems(c4.id,
      ['Transportation',    'Flight (Karachi return)',    900],
      ['Accommodation',     'Hotel – 2 nights',          700],
      ['Conference/Events', 'Workshop registration',     300],
      ['Meals',             'Team dinner',               200],
    );

    // ── Claim 5: Rejected (John) ───────────────────────────────
    const c5 = (await insertClaim({
      emp: emp1.id, title: 'Tech Workshop Islamabad', dest: 'Islamabad, Pakistan',
      start: '2026-03-15', end: '2026-03-16',
      purpose: 'Internal tech upskill workshop',
      total: 2200, status: 'rejected',
      reviewer: manager.id, reviewedAt: new Date('2026-03-18'),
    })).rows[0];
    await insertItems(c5.id,
      ['Transportation',  'Flight',                       900],
      ['Miscellaneous',   'Workshop materials & extras', 1300],
    );
    await insertComment(c5.id, manager.id, 'Miscellaneous amount of PKR 1,300 exceeds the PKR 500 policy limit. Please resubmit with itemised receipts.');
    await insertComment(c5.id, emp1.id, 'Understood — I will break down those costs separately and resubmit.');

    // ── Claim 6: Old submitted (overdue demo for admin) ────────
    const c6 = (await insertClaim({
      emp: emp2.id, title: 'Client Event Peshawar', dest: 'Peshawar, Pakistan',
      start: '2026-04-10', end: '2026-04-11',
      purpose: 'Regional client appreciation event',
      total: 750, status: 'submitted',
      reviewer: null, reviewedAt: null,
    })).rows[0];
    await client.query(
      `UPDATE expense_claims SET created_at = NOW() - INTERVAL '7 days' WHERE id = $1`, [c6.id]
    );
    await insertItems(c6.id,
      ['Transportation', 'Bus tickets (return)',   250],
      ['Accommodation',  'Hotel – 1 night',        300],
      ['Meals',          'Event catering share',   200],
    );

    await client.query('COMMIT');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📧 Demo Credentials (password: password123 for all)');
    console.log('─────────────────────────────────────────────────────');
    console.log('  Admin    →  admin@portal.com');
    console.log('  Manager  →  manager@portal.com');
    console.log('  Employee →  john@portal.com');
    console.log('  Employee →  emily@portal.com\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
