const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'rentelio',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

const query = (text, params) => pool.query(text, params);

const initDatabase = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      category VARCHAR(100) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      "pricePerDay" DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Available',
      description TEXT DEFAULT '',
      "imageUrl" TEXT DEFAULT '',
      "securityDeposit" DECIMAL(10, 2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(30) DEFAULT '',
      address TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rentals (
      id SERIAL PRIMARY KEY,
      "customerName" VARCHAR(150) NOT NULL,
      "customerId" INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      "productId" INTEGER REFERENCES products(id) ON DELETE CASCADE,
      "startDate" DATE NOT NULL,
      "returnDate" DATE NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id SERIAL PRIMARY KEY,
      "rentalId" INTEGER REFERENCES rentals(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Held',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "imageUrl" TEXT DEFAULT ''`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "securityDeposit" DECIMAL(10, 2) DEFAULT 0`);
  await query(`ALTER TABLE rentals ADD COLUMN IF NOT EXISTS "customerId" INTEGER REFERENCES customers(id) ON DELETE SET NULL`);

  // Normalize legacy overdue label into shared lifecycle status
  await query(`UPDATE rentals SET status = 'Return Pending' WHERE status = 'Overdue'`);
};

module.exports = { pool, query, initDatabase };
