# ✈️ Travel Expense Reimbursement & Approval Portal

> **Group 12 — Web Engineering Project**  
> Full-stack PERN application (PostgreSQL · Express · React · Node.js)

---

## 🚀 Quick Start

### 1. Configure the database connection

Edit **`server/.env`** and set your PostgreSQL password:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD_HERE@localhost:5432/travel_expense_db
```

### 2. Create the database in psql (run once)

```sql
CREATE DATABASE travel_expense_db;
```

Or via command line:
```bash
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE travel_expense_db;"
```

### 3. Install root dependencies (for setup script)

```bash
npm install
```

### 4. Run DB setup & seed

```bash
node setup-db.js
```

This creates all tables and inserts demo users + 6 sample claims.

### 5. Start the backend (Terminal 1)

```bash
cd server
npm run dev
```
Server runs at **http://localhost:5000**

### 6. Start the frontend (Terminal 2)

```bash
cd client
npm run dev
```
App runs at **http://localhost:5173**

---

## 🔑 Demo Credentials

> Password for all accounts: **`password123`**

| Role     | Email                  |
|----------|------------------------|
| Admin    | admin@portal.com       |
| Manager  | manager@portal.com     |
| Employee | john@portal.com        |
| Employee | emily@portal.com       |

---

## 📁 Project Structure

```
travel-expense-portal/
├── server/                   Express + Node.js API
│   ├── src/
│   │   ├── db/               schema.sql, seed.js, pool.js
│   │   ├── middleware/       auth.js (JWT + role guard)
│   │   └── routes/           auth, claims, categories, comments, admin
│   └── .env                  DB credentials + JWT secret
│
├── client/                   React 18 + Vite frontend
│   └── src/
│       ├── api/              Axios instance
│       ├── context/          AuthContext (JWT state)
│       ├── components/       Layout, StatusBadge, ClaimCard, CommentTrail…
│       └── pages/            Login, Dashboard, SubmitClaim, ClaimDetail…
│
└── setup-db.js               One-time DB setup + seed script
```

---

## 🎭 User Roles & Features

| Feature                          | Employee | Manager | Admin |
|----------------------------------|:--------:|:-------:|:-----:|
| Submit expense claim             | ✅       |         |       |
| View own claim history           | ✅       |         |       |
| View claim details + comments    | ✅       | ✅      | ✅    |
| Approval queue (all claims)      |          | ✅      | ✅    |
| Approve / Reject / Mark reviewed |          | ✅      | ✅    |
| Mark as Reimbursed               |          | ✅      | ✅    |
| Add comments / revision notes    | ✅       | ✅      | ✅    |
| Admin dashboard + charts         |          |         | ✅    |
| User management (CRUD)           |          |         | ✅    |

---

## 📊 API Endpoints

| Method | Route                       | Access           |
|--------|-----------------------------|------------------|
| POST   | /api/auth/login             | Public           |
| GET    | /api/auth/me                | Authenticated    |
| GET    | /api/claims                 | All (role-aware) |
| POST   | /api/claims                 | Employee         |
| GET    | /api/claims/summary         | All              |
| GET    | /api/claims/:id             | All (role-aware) |
| PATCH  | /api/claims/:id/status      | Manager, Admin   |
| GET    | /api/categories             | Authenticated    |
| POST   | /api/comments/:claimId      | Authenticated    |
| GET    | /api/admin/dashboard        | Manager, Admin   |
| GET    | /api/admin/users            | Admin            |
| POST   | /api/admin/users            | Admin            |
| DELETE | /api/admin/users/:id        | Admin            |

---

## 🗃️ Expense Categories & Policy Limits

| Category          | Limit (PKR) |
|-------------------|-------------|
| Transportation    | 5,000       |
| Accommodation     | 3,000       |
| Meals             | 1,000       |
| Conference/Events | 2,000       |
| Communication     | 200         |
| Miscellaneous     | 500         |
