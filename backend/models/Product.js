const { query } = require('../config/database');

const Product = {
  async findAll() {
    const result = await query('SELECT * FROM products ORDER BY id DESC');
    return result.rows;
  },

  async findAvailable(filters = {}) {
    const clauses = [`status = 'Available'`, `quantity > 0`];
    const params = [];
    let i = 1;

    if (filters.category) {
      clauses.push(`LOWER(category) = LOWER($${i++})`);
      params.push(filters.category);
    }
    if (filters.search) {
      clauses.push(`(LOWER(name) LIKE $${i} OR LOWER(category) LIKE $${i})`);
      params.push(`%${String(filters.search).toLowerCase()}%`);
      i += 1;
    }
    if (filters.minPrice != null && filters.minPrice !== '') {
      clauses.push(`"pricePerDay" >= $${i++}`);
      params.push(Number(filters.minPrice));
    }
    if (filters.maxPrice != null && filters.maxPrice !== '') {
      clauses.push(`"pricePerDay" <= $${i++}`);
      params.push(Number(filters.maxPrice));
    }

    const result = await query(
      `SELECT * FROM products WHERE ${clauses.join(' AND ')} ORDER BY id DESC`,
      params
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({
    name,
    category,
    quantity,
    pricePerDay,
    status = 'Available',
    description = '',
    imageUrl = '',
    securityDeposit = 0,
  }) {
    const result = await query(
      `INSERT INTO products (name, category, quantity, "pricePerDay", status, description, "imageUrl", "securityDeposit")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, category, quantity, pricePerDay, status, description, imageUrl, securityDeposit]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const result = await query(
      `UPDATE products
       SET name = $1, category = $2, quantity = $3, "pricePerDay" = $4, status = $5,
           description = $6, "imageUrl" = $7, "securityDeposit" = $8
       WHERE id = $9 RETURNING *`,
      [
        data.name ?? existing.name,
        data.category ?? existing.category,
        data.quantity != null ? data.quantity : existing.quantity,
        data.pricePerDay != null ? data.pricePerDay : existing.pricePerDay,
        data.status ?? existing.status,
        data.description != null ? data.description : existing.description || '',
        data.imageUrl != null ? data.imageUrl : existing.imageUrl || '',
        data.securityDeposit != null ? data.securityDeposit : existing.securityDeposit || 0,
        id,
      ]
    );
    return result.rows[0] || null;
  },

  async delete(id) {
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  },

  async getCategories() {
    const result = await query(
      `SELECT DISTINCT category FROM products WHERE status = 'Available' AND quantity > 0 ORDER BY category`
    );
    return result.rows.map((r) => r.category);
  },
};

module.exports = Product;
