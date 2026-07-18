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

- Node.js 18+
- Local PostgreSQL on port 5432

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

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@rentelio.com | admin123 |
| Vendor | vendor@rentelio.com | vendor123 |
| User | customer@rentelio.com | customer123 |

## Role isolation

- **User** — own rentals, wallet, cart, wishlist, profile only  
- **Vendor** — own products, rentals, deposits, customers, reports only (`vendorId` scope)  
- **Super Admin** — entire platform (users, vendors, ads, fraud, backups, settings)

Logging into one portal clears other portal sessions.

## Route map

- User: `/user/dashboard`, `/user/browse`, `/user/rentals`, …  
- Vendor: `/vendor/dashboard`, `/vendor/inventory`, …  
- Super Admin: `/admin/dashboard`, `/admin/users`, `/admin/vendors`, `/admin/platform`, …

Legacy `/shop/*` and `/login` redirect to the new portals.
