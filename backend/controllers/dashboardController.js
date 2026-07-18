const { query } = require('../config/database');
const Rental = require('../models/Rental');

const getDashboard = async (req, res) => {
  try {
    await Rental.syncLifecycleStatuses();

    const [
      productsRes,
      availableRes,
      activeRes,
      pendingRes,
      overdueRes,
      revenueRes,
      statusRes,
      recentRes,
    ] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM products'),
      query(`SELECT COUNT(*)::int AS count FROM products WHERE status = 'Available'`),
      query(`SELECT COUNT(*)::int AS count FROM rentals WHERE status IN ('Active', 'Requested')`),
      query(
        `SELECT COUNT(*)::int AS count FROM rentals WHERE status IN ('Active', 'Return Pending', 'Requested')`
      ),
      query(`SELECT COUNT(*)::int AS count FROM rentals WHERE status = 'Return Pending'`),
      query(`SELECT COALESCE(SUM(amount), 0)::float AS total FROM rentals`),
      query(`
        SELECT status, COUNT(*)::int AS count
        FROM rentals
        GROUP BY status
      `),
      query(`
        SELECT r.id, r."customerName", p.name AS "productName",
               r."startDate", r."returnDate", r.status, r.amount,
               d.amount AS "depositAmount"
        FROM rentals r
        LEFT JOIN products p ON r."productId" = p.id
        LEFT JOIN deposits d ON d."rentalId" = r.id
        ORDER BY r.id DESC
        LIMIT 8
      `),
    ]);

    const statusChart = {
      Requested: 0,
      Active: 0,
      'Return Pending': 0,
      Completed: 0,
    };
    statusRes.rows.forEach((row) => {
      if (statusChart[row.status] !== undefined) {
        statusChart[row.status] = row.count;
      } else if (row.status === 'Overdue') {
        statusChart['Return Pending'] += row.count;
      }
    });

    res.json({
      stats: {
        totalProducts: productsRes.rows[0].count,
        availableProducts: availableRes.rows[0].count,
        activeRentals: activeRes.rows[0].count,
        pendingReturns: pendingRes.rows[0].count,
        overdueRentals: overdueRes.rows[0].count,
        totalRevenue: revenueRes.rows[0].total,
      },
      statusChart,
      recentRentals: recentRes.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
};

module.exports = { getDashboard };
