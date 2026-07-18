const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');
const { sanitizeVendor } = require('../middleware/vendorAuth');
const { toNumber } = require('../utils/serializers');

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });

    if (!vendor || !vendor.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, vendor.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (vendor.blacklisted || vendor.status === 'Blacklisted') {
      return res.status(403).json({ message: 'Vendor account is blacklisted' });
    }

    const token = signToken({ id: vendor.id, type: 'vendor', role: 'vendor', portal: 'vendor' });
    const safe = sanitizeVendor(vendor);
    res.json({
      token,
      vendor: {
        ...safe,
        role: 'vendor',
        roleLabel: 'Vendor',
        pendingPayout: toNumber(vendor.pendingPayout),
        paidOut: toNumber(vendor.paidOut),
        lateFeeAmount: toNumber(vendor.lateFeeAmount),
      },
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, company, address } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const vendor = await prisma.vendor.create({
      data: {
        name,
        email: String(email).toLowerCase().trim(),
        password: hash,
        phone: phone || '',
        company: company || name,
        address: address || '',
        status: 'Approved',
        verified: true,
      },
    });

    const token = signToken({ id: vendor.id, type: 'vendor', role: 'vendor', portal: 'vendor' });
    res.status(201).json({
      token,
      vendor: { ...sanitizeVendor(vendor), role: 'vendor', roleLabel: 'Vendor' },
      message: 'Vendor account created',
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    console.error('Vendor register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

module.exports = { login, register };
