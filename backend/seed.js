require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, initDatabase, query } = require('./config/database');

const seed = async () => {
  try {
    await pool.query('SELECT 1');
    await initDatabase();

    await query('DELETE FROM deposits');
    await query('DELETE FROM rentals');
    await query('DELETE FROM customers');
    await query('DELETE FROM products');
    await query('DELETE FROM users');

    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);
    const customerHash = await bcrypt.hash('customer123', 10);

    await query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      ['Admin User', 'admin@rentelio.com', adminHash, 'admin']
    );
    await query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      ['Staff User', 'user@rentelio.com', userHash, 'user']
    );

    const customerRes = await query(
      `INSERT INTO customers (name, email, password, phone, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        'Rahul Verma',
        'customer@rentelio.com',
        customerHash,
        '+91 98765 43210',
        '221B MG Road, Bengaluru, Karnataka 560001',
      ]
    );
    const customerId = customerRes.rows[0].id;

    const products = [
      ['Canon EOS R5', 'Camera', 3, 1500, 'Available', 'Professional full-frame mirrorless camera for cinema and photography.', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', 3000],
      ['Sony A7 IV', 'Camera', 2, 1200, 'Available', 'Versatile hybrid camera with outstanding autofocus and 4K video.', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80', 2400],
      ['DJI Mavic 3', 'Drone', 2, 2000, 'Available', 'Cinematic drone with Hasselblad camera and long flight time.', 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80', 4000],
      ['MacBook Pro 16"', 'Laptop', 4, 800, 'Available', 'Powerful laptop for editing, design, and development workflows.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', 1600],
      ['iPad Pro 12.9"', 'Tablet', 5, 400, 'Available', 'Large Liquid Retina display tablet ideal for sketching and review.', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80', 800],
      ['Sony FX3', 'Camera', 1, 2500, 'Available', 'Cinema line camera built for creators who need compact performance.', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', 5000],
      ['Godox Softbox Kit', 'Lighting', 6, 300, 'Available', 'Studio softbox lighting kit for soft, controlled illumination.', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', 600],
      ['Rode Wireless GO II', 'Audio', 8, 250, 'Available', 'Compact dual-channel wireless mic system for interviews and vlogs.', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80', 500],
      ['GoPro Hero 12', 'Camera', 4, 500, 'Available', 'Action camera built for adventure, sports, and waterproof shoots.', 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800&q=80', 1000],
      ['Epson Projector', 'Projector', 3, 700, 'Available', 'Bright HD projector for presentations, events, and movie nights.', 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80', 1400],
    ];

    const productIds = [];
    for (const p of products) {
      const res = await query(
        `INSERT INTO products (name, category, quantity, "pricePerDay", status, description, "imageUrl", "securityDeposit")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        p
      );
      productIds.push(res.rows[0].id);
    }

    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const addDays = (n) => {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return d;
    };

    // Shared rentals table — admin walk-ins + customer bookings
    const rentals = [
      [null, 'Aarav Sharma', productIds[0], fmt(addDays(-5)), fmt(addDays(2)), 10500, 'Active'],
      [null, 'Priya Patel', productIds[2], fmt(addDays(-10)), fmt(addDays(-2)), 16000, 'Return Pending'],
      [null, 'Rohan Mehta', productIds[3], fmt(addDays(-3)), fmt(addDays(4)), 5600, 'Active'],
      [null, 'Sneha Reddy', productIds[1], fmt(addDays(-20)), fmt(addDays(-10)), 12000, 'Completed'],
      [customerId, 'Rahul Verma', productIds[5], fmt(addDays(-2)), fmt(addDays(5)), 17500, 'Active'],
      [customerId, 'Rahul Verma', productIds[8], fmt(addDays(-12)), fmt(addDays(-5)), 3500, 'Completed'],
      [customerId, 'Rahul Verma', productIds[9], fmt(addDays(1)), fmt(addDays(4)), 2100, 'Requested'],
    ];

    const rentalIds = [];
    for (const r of rentals) {
      const res = await query(
        `INSERT INTO rentals ("customerId", "customerName", "productId", "startDate", "returnDate", amount, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        r
      );
      rentalIds.push(res.rows[0].id);
    }

    // Decrease stock for non-completed rentals (product indexes used above)
    const lockedProductIds = [productIds[0], productIds[2], productIds[3], productIds[5], productIds[9]];
    for (const pid of lockedProductIds) {
      await query(
        `UPDATE products SET quantity = GREATEST(quantity - 1, 0),
           status = CASE WHEN quantity - 1 <= 0 THEN 'Rented' ELSE 'Available' END
         WHERE id = $1`,
        [pid]
      );
    }

    const deposits = [
      [rentalIds[0], 3000, 'Held'],
      [rentalIds[1], 4000, 'Held'],
      [rentalIds[2], 1600, 'Held'],
      [rentalIds[3], 2400, 'Refunded'],
      [rentalIds[4], 5000, 'Held'],
      [rentalIds[5], 1000, 'Refunded'],
      [rentalIds[6], 1400, 'Held'],
    ];

    for (const d of deposits) {
      await query(
        `INSERT INTO deposits ("rentalId", amount, status) VALUES ($1, $2, $3)`,
        d
      );
    }

    console.log('Seed completed successfully!');
    console.log('Admin:     admin@rentelio.com / admin123');
    console.log('Staff:     user@rentelio.com / user123');
    console.log('Customer:  customer@rentelio.com / customer123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
