const Customer = require('../models/Customer');

/** Simple customer auth: Authorization: Bearer customer-token-{id} */
const requireCustomer = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const match = /^customer-token-(\d+)$/.exec(token);

    if (!match) {
      return res.status(401).json({ message: 'Please log in to continue' });
    }

    const customer = await Customer.findById(Number(match[1]));
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
