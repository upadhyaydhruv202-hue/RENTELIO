# Rentelio

**Don't get Mental, Just do Rental**

Full-stack rental marketplace with **exactly three roles**:

| Role | Who | Portal |
|------|-----|--------|
| **User** | Customer who rents products | `/user/login` → `/user/dashboard` |
| **Vendor** | Rental business owner | `/vendor/login` → `/vendor/dashboard` |
| **Super Admin** | Platform owner | `/admin/login` → `/admin/dashboard` |

User and Customer are the same role (not separate).

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router, TanStack Query
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (local)
- **ORM:** Prisma 5
- **Auth:** JWT per portal (`type`: `customer` \| `vendor` \| `staff` + `role`)
## Prerequisites

* Node.js 18+
* Local PostgreSQL on port 5432

## Setup

### 1. Database

```sql
CREATE DATABASE rentelio;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run seed
npm run dev
```

API: `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`
