const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');

const sanitizeVendor = (vendor) => {
  if (!vendor) return null;
  const { password, ...rest } = vendor;
  return rest;
};

const requireVendor = async (req, res, next) => {
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

    if (payload.type !== 'vendor') {
      return res.status(401).json({ message: 'Invalid session' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: Number(payload.id) } });
    if (!vendor || !vendor.password) {
      return res.status(401).json({ message: 'Invalid session' });
    }
    if (vendor.blacklisted || vendor.status === 'Blacklisted') {
      return res.status(403).json({ message: 'Vendor account is blacklisted' });
    }
    if (vendor.status === 'Pending') {
      return res.status(403).json({ message: 'Vendor account pending approval' });
    }

    req.vendor = {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      company: vendor.company,
      phone: vendor.phone,
      address: vendor.address,
      logo: vendor.logo,
      status: vendor.status,
      verified: vendor.verified,
      lateFeeMode: vendor.lateFeeMode,
      lateFeeAmount: vendor.lateFeeAmount,
      gracePeriodHours: vendor.gracePeriodHours,
      maxLateFeePercent: vendor.maxLateFeePercent,
    };
    req.vendorRow = vendor;
    next();
  } catch (error) {
    console.error('Vendor auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

module.exports = { requireVendor, sanitizeVendor };
