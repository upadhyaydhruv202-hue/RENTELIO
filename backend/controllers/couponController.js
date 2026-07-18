const prisma = require('../config/prisma');
const { toNumber } = require('../utils/serializers');

const serialize = (c) => ({
  ...c,
  value: toNumber(c.value),
});

const validateCoupon = async (req, res) => {
  try {
    const code = String(req.body?.code || req.query?.code || '').trim();
    if (!code) {
      return res.status(400).json({ message: 'code is required', valid: false });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.active) {
      return res.status(404).json({ message: 'Invalid coupon', valid: false });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'Coupon expired', valid: false });
    }

    res.json({ valid: true, coupon: serialize(coupon) });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ message: 'Failed to validate coupon', valid: false });
  }
};

const listCoupons = async (req, res) => {
  try {
    const rows = await prisma.coupon.findMany({ orderBy: { id: 'desc' } });
    res.json(rows.map(serialize));
  } catch (error) {
    console.error('List coupons error:', error);
    res.status(500).json({ message: 'Failed to list coupons' });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { code, type, value, label, active, expiresAt } = req.body || {};
    if (!code || value == null) {
      return res.status(400).json({ message: 'code and value are required' });
    }

    const row = await prisma.coupon.create({
      data: {
        code: String(code).trim().toUpperCase(),
        type: type || 'percent',
        value: Number(value),
        label: label || '',
        active: active !== false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json(serialize(row));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Coupon code already exists' });
    }
    console.error('Create coupon error:', error);
    res.status(500).json({ message: 'Failed to create coupon' });
  }
};

module.exports = { validateCoupon, listCoupons, createCoupon };
