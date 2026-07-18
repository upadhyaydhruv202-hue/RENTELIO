const { query } = require('../config/database');

const Customer = {
  async findByEmail(email) {
    const result = await query('SELECT * FROM customers WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await query(
      `SELECT id, name, email, phone, address, created_at AS "createdAt"
       FROM customers WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ name, email, password, phone = '', address = '' }) {
    const result = await query(
      `INSERT INTO customers (name, email, password, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, address, created_at AS "createdAt"`,
      [name, email, password, phone, address]
    );
    return result.rows[0];
  },

  async update(id, { name, phone, address }) {
    const result = await query(
      `UPDATE customers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address)
       WHERE id = $4
       RETURNING id, name, email, phone, address, created_at AS "createdAt"`,
      [name, phone, address, id]
    );
    return result.rows[0] || null;
  },
};

module.exports = Customer;
