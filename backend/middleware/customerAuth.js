const { verifyToken } = require('../utils/jwt');
const Customer = require('../models/Customer');

const requireCustomer = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) {
      return res.status(401).json({ message: 'Please log in to continue' });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    if (payload.type !== 'customer') {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const customer = await Customer.findById(payload.id);
    if (!customer) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.customer = customer;
    next();
  } catch (error) {
    console.error('Customer auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

module.exports = { requireCustomer };
