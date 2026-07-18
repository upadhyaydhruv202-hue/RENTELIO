const { query } = require('../config/database');

const Deposit = {
  async findAll() {
    const result = await query(`
      SELECT d.*, r."customerName", r.id AS "rentalId"
      FROM deposits d
      LEFT JOIN rentals r ON d."rentalId" = r.id
      ORDER BY d.id DESC
    `);
    return result.rows;
  },

  async findByRentalId(rentalId) {
    const result = await query('SELECT * FROM deposits WHERE "rentalId" = $1', [rentalId]);
    return result.rows[0] || null;
  },

  async create({ rentalId, amount, status = 'Held' }) {
    const result = await query(
      `INSERT INTO deposits ("rentalId", amount, status)
       VALUES ($1, $2, $3) RETURNING *`,
      [rentalId, amount, status]
    );
    return result.rows[0];
  },

  async updateStatus(id, status) {
    const result = await query(
      'UPDATE deposits SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  },

  async updateStatusByRentalId(rentalId, status) {
    const result = await query(
      'UPDATE deposits SET status = $1 WHERE "rentalId" = $2 RETURNING *',
      [status, rentalId]
    );
    return result.rows[0] || null;
  },
};

module.exports = Deposit;
