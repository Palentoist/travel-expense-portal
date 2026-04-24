-- ============================================================
-- Travel Expense Reimbursement & Approval Portal — Schema
-- ============================================================

DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS expense_items CASCADE;
DROP TABLE IF EXISTS expense_claims CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  email        VARCHAR(150)  UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role         VARCHAR(20)   NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  department   VARCHAR(100),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- Expense categories with policy limits
CREATE TABLE categories (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  limit_amount DECIMAL(10,2) NOT NULL,
  description  TEXT
);

-- Expense claims (one per trip)
CREATE TABLE expense_claims (
  id           SERIAL PRIMARY KEY,
  employee_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(200)  NOT NULL,
  destination  VARCHAR(200)  NOT NULL,
  trip_start   DATE NOT NULL,
  trip_end     DATE NOT NULL,
  purpose      TEXT,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status       VARCHAR(30)   NOT NULL DEFAULT 'submitted'
                 CHECK (status IN ('submitted','under_review','approved','rejected','reimbursed')),
  reviewed_by  INTEGER REFERENCES users(id),
  reviewed_at  TIMESTAMP,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- Individual expense line items
CREATE TABLE expense_items (
  id          SERIAL PRIMARY KEY,
  claim_id    INTEGER REFERENCES expense_claims(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  description VARCHAR(255),
  amount      DECIMAL(10,2) NOT NULL,
  receipt_url VARCHAR(500),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Comment trail (revision requests, notes)
CREATE TABLE comments (
  id         SERIAL PRIMARY KEY,
  claim_id   INTEGER REFERENCES expense_claims(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id),
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed: default categories
INSERT INTO categories (name, limit_amount, description) VALUES
  ('Transportation',    5000.00, 'Flights, trains, taxis, car rentals'),
  ('Accommodation',     3000.00, 'Hotels and lodging'),
  ('Meals',             1000.00, 'Food and beverages'),
  ('Conference/Events', 2000.00, 'Registration fees and events'),
  ('Communication',      200.00, 'Phone and internet charges'),
  ('Miscellaneous',      500.00, 'Other approved business expenses');
