require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase, pool } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const rentalRoutes = require('./routes/rentalRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Rentelio' });
});

app.use('/api', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/user', require('./routes/customerRoutes'));

const start = async () => {
  try {
    await pool.query('SELECT 1');
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Rentelio API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    console.error('Check your PostgreSQL connection in backend/.env');
    process.exit(1);
  }
};

start();
