const { query } = require('../config/database');

const Rental = {
  async findAll() {
    const result = await query(`
      SELECT r.*,
             p.name AS "productName",
             p."pricePerDay",
             p.category,
             p."imageUrl",
             d.amount AS "depositAmount",
             d.status AS "depositStatus",
             d.id AS "depositId",
             c.email AS "customerEmail"
      FROM rentals r
      LEFT JOIN products p ON r."productId" = p.id
      LEFT JOIN deposits d ON d."rentalId" = r.id
      LEFT JOIN customers c ON r."customerId" = c.id
      ORDER BY r.id DESC
    `);
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      `SELECT r.*,
              p.name AS "productName",
              p."pricePerDay",
              p.category,
              p."imageUrl",
              p.description,
              d.amount AS "depositAmount",
              d.status AS "depositStatus",
              d.id AS "depositId"
       FROM rentals r
       LEFT JOIN products p ON r."productId" = p.id
       LEFT JOIN deposits d ON d."rentalId" = r.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByCustomer(customerId) {
    const result = await query(
      `SELECT r.*,
              p.name AS "productName",
              p.category,
              p."imageUrl",
              p."pricePerDay",
              p.description,
              d.amount AS "depositAmount",
              d.status AS "depositStatus",
              d.id AS "depositId"
       FROM rentals r
       LEFT JOIN products p ON r."productId" = p.id
       LEFT JOIN deposits d ON d."rentalId" = r.id
       WHERE r."customerId" = $1
       ORDER BY r.id DESC`,
      [customerId]
    );
    return result.rows;
  },

  async findByIdForCustomer(id, customerId) {
    const result = await query(
      `SELECT r.*,
              p.name AS "productName",
              p.category,
              p."imageUrl",
              p."pricePerDay",
              p.description,
              d.amount AS "depositAmount",
              d.status AS "depositStatus",
              d.id AS "depositId"
       FROM rentals r
       LEFT JOIN products p ON r."productId" = p.id
       LEFT JOIN deposits d ON d."rentalId" = r.id
       WHERE r.id = $1 AND r."customerId" = $2`,
      [id, customerId]
    );
    return result.rows[0] || null;
  },

  async create({
    customerName,
    customerId = null,
    productId,
    startDate,
    returnDate,
    amount,
    status = 'Active',
  }) {
    const result = await query(
      `INSERT INTO rentals ("customerName", "customerId", "productId", "startDate", "returnDate", amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [customerName, customerId, productId, startDate, returnDate, amount, status]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await query(
      `UPDATE rentals SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async getPendingReturns() {
    const result = await query(`
      SELECT r.*,
             p.name AS "productName",
             p."pricePerDay",
             d.amount AS "depositAmount",
             d.status AS "depositStatus"
      FROM rentals r
      LEFT JOIN products p ON r."productId" = p.id
      LEFT JOIN deposits d ON d."rentalId" = r.id
      WHERE r.status IN ('Active', 'Return Pending', 'Requested')
      ORDER BY r."returnDate" ASC
    `);
    return result.rows;
  },

  async getCustomerStats(customerId) {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'Active')::int AS "activeRentals",
         COUNT(*) FILTER (WHERE status IN ('Active', 'Return Pending') AND "returnDate" >= CURRENT_DATE)::int AS "upcomingReturns",
         COUNT(*) FILTER (WHERE status = 'Completed')::int AS "completedRentals",
         COUNT(*) FILTER (WHERE status = 'Requested')::int AS "pendingRequests"
       FROM rentals
       WHERE "customerId" = $1`,
      [customerId]
    );
    return result.rows[0];
  },

  /** Shared lifecycle sync for admin + customer views */
  async syncLifecycleStatuses(customerId = null) {
    const customerFilter = customerId ? `AND "customerId" = $1` : '';
    const params = customerId ? [customerId] : [];

    await query(
      `UPDATE rentals SET status = 'Return Pending'
       WHERE status IN ('Active', 'Overdue')
         AND "returnDate" < CURRENT_DATE
         ${customerFilter}`,
      params
    );

    await query(
      `UPDATE rentals SET status = 'Active'
       WHERE status = 'Requested'
         AND "startDate" <= CURRENT_DATE
         AND "returnDate" >= CURRENT_DATE
         ${customerFilter}`,
      params
    );

    await query(`UPDATE rentals SET status = 'Return Pending' WHERE status = 'Overdue'`);
  },
};

module.exports = Rental;
