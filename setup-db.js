/**
 * setup-db.js — Run this once to create tables and seed demo data.
 * Usage:  node setup-db.js
 *
 * Reads DATABASE_URL from server/.env
 */
require('dotenv').config({ path: require('path').join(__dirname, 'server/.env') });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅ Connected to PostgreSQL');

  // ── Create tables ──────────────────────────────────────────────────────────
  const schema = fs.readFileSync(
    path.join(__dirname, 'server/src/db/schema.sql'), 'utf8'
  );
  await client.query(schema);
  console.log('✅ Tables created');

  // ── Seed data ──────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10);

  // Users
  const adminRes = await client.query(`
    INSERT INTO users (name, email, password_hash, role, department)
    VALUES ('Admin User', 'admin@portal.com', $1, 'admin', 'IT')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`, [hash]);

  const managerRes = await client.query(`
    INSERT INTO users (name, email, password_hash, role, department)
    VALUES ('Sarah Johnson', 'manager@portal.com', $1, 'manager', 'Finance')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`, [hash]);

  const emp1Res = await client.query(`
    INSERT INTO users (name, email, password_hash, role, department)
    VALUES ('John Smith', 'john@portal.com', $1, 'employee', 'Sales')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`, [hash]);

  const emp2Res = await client.query(`
    INSERT INTO users (name, email, password_hash, role, department)
    VALUES ('Emily Davis', 'emily@portal.com', $1, 'employee', 'Marketing')
    ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`, [hash]);

  const managerId = managerRes.rows[0].id;
  const emp1Id    = emp1Res.rows[0].id;
  const emp2Id    = emp2Res.rows[0].id;

  // Category map
  const cats = (await client.query('SELECT id, name FROM categories')).rows;
  const C = Object.fromEntries(cats.map(c => [c.name, c.id]));

  const addClaim = (fields) => client.query(`
    INSERT INTO expense_claims
      (employee_id, title, destination, trip_start, trip_end, purpose, total_amount, status, reviewed_by, reviewed_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, fields);

  const addItems = (claimId, ...items) =>
    Promise.all(items.map(([cat, desc, amt]) =>
      client.query('INSERT INTO expense_items (claim_id, category_id, description, amount) VALUES ($1,$2,$3,$4)',
        [claimId, C[cat], desc, amt])
    ));

  const addComment = (claimId, userId, msg) =>
    client.query('INSERT INTO comments (claim_id, user_id, message) VALUES ($1,$2,$3)', [claimId, userId, msg]);

  // Claim 1: Reimbursed
  const c1 = (await addClaim([emp1Id, 'Sales Conference Dubai', 'Dubai, UAE', '2026-02-10', '2026-02-14',
    'Annual global sales conference and client meetings', 4200, 'reimbursed', managerId, new Date('2026-02-16')])).rows[0];
  await addItems(c1.id, ['Transportation', 'Round-trip flight', 2500], ['Accommodation', 'Hotel – 4 nights', 1400], ['Meals', 'Client dinners', 300]);
  await addComment(c1.id, managerId, 'All receipts verified. Approved for reimbursement.');

  // Claim 2: Approved
  const c2 = (await addClaim([emp2Id, 'Marketing Summit Islamabad', 'Islamabad, Pakistan', '2026-03-05', '2026-03-07',
    'Digital marketing summit and networking', 1600, 'approved', managerId, new Date('2026-03-09')])).rows[0];
  await addItems(c2.id, ['Transportation', 'Flight tickets', 800], ['Accommodation', 'Hotel – 2 nights', 600], ['Conference/Events', 'Summit registration fee', 200]);
  await addComment(c2.id, managerId, 'Looks good — approved. Finance will process reimbursement shortly.');

  // Claim 3: Under Review
  const c3 = (await addClaim([emp1Id, 'Client Visit Lahore', 'Lahore, Pakistan', '2026-04-20', '2026-04-22',
    'Client onboarding and project kick-off', 850, 'under_review', managerId, null])).rows[0];
  await addItems(c3.id, ['Transportation', 'Train tickets (return)', 350], ['Accommodation', 'Hotel – 2 nights', 500]);
  await addComment(c3.id, managerId, 'Please upload hotel receipt scans to proceed.');

  // Claim 4: Submitted (pending)
  const c4 = (await addClaim([emp2Id, 'Brand Workshop Karachi', 'Karachi, Pakistan', '2026-04-25', '2026-04-27',
    'Brand strategy workshop with agency', 2100, 'submitted', null, null])).rows[0];
  await addItems(c4.id, ['Transportation', 'Flight (return)', 900], ['Accommodation', 'Hotel – 2 nights', 700], ['Conference/Events', 'Workshop registration', 300], ['Meals', 'Team dinner', 200]);

  // Claim 5: Rejected
  const c5 = (await addClaim([emp1Id, 'Tech Workshop Islamabad', 'Islamabad, Pakistan', '2026-03-15', '2026-03-16',
    'Internal tech upskill workshop', 2200, 'rejected', managerId, new Date('2026-03-18')])).rows[0];
  await addItems(c5.id, ['Transportation', 'Flight', 900], ['Miscellaneous', 'Workshop materials & extras', 1300]);
  await addComment(c5.id, managerId, 'Miscellaneous amount exceeds the PKR 500 policy limit. Please resubmit with itemised receipts.');
  await addComment(c5.id, emp1Id, 'Understood — I will break down those costs and resubmit.');

  // Claim 6: Overdue (old submitted, for admin demo)
  const c6 = (await addClaim([emp2Id, 'Client Event Peshawar', 'Peshawar, Pakistan', '2026-04-10', '2026-04-11',
    'Regional client appreciation event', 750, 'submitted', null, null])).rows[0];
  await client.query(`UPDATE expense_claims SET created_at = NOW() - INTERVAL '7 days' WHERE id = $1`, [c6.id]);
  await addItems(c6.id, ['Transportation', 'Bus tickets (return)', 250], ['Accommodation', 'Hotel – 1 night', 300], ['Meals', 'Event catering share', 200]);

  await client.end();

  console.log('\n🌱 Database seeded successfully!\n');
  console.log('📧 Demo Credentials (password: password123 for all)');
  console.log('─────────────────────────────────────────────────');
  console.log('  Admin    →  admin@portal.com');
  console.log('  Manager  →  manager@portal.com');
  console.log('  Employee →  john@portal.com');
  console.log('  Employee →  emily@portal.com\n');
}

main().catch(err => { console.error('❌ Setup failed:', err.message); process.exit(1); });
