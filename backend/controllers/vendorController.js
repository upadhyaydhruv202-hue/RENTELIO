const prisma = require('../config/prisma');
const { toNumber } = require('../utils/serializers');
const { logActivity } = require('../services/activity');

const serialize = (v) => {
  if (!v) return null;
  const { password, ...rest } = v;
  return {
    ...rest,
    pendingPayout: toNumber(v.pendingPayout),
    paidOut: toNumber(v.paidOut),
    lateFeeAmount: toNumber(v.lateFeeAmount),
  };
};

const listVendors = async (req, res) => {
  try {
    const rows = await prisma.vendor.findMany({ orderBy: { id: 'desc' } });
    res.json(rows.map(serialize));
  } catch (error) {
    console.error('List vendors error:', error);
    res.status(500).json({ message: 'Failed to list vendors' });
  }
};

const createVendor = async (req, res) => {
  try {
    const { name, email, phone, company } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' });
    }

    const row = await prisma.vendor.create({
      data: { name, email, phone: phone || '', company: company || '' },
    });

    await logActivity('vendor', `Vendor ${name} created`, { id: row.id });
    res.status(201).json(serialize(row));
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Vendor email already exists' });
    }
    console.error('Create vendor error:', error);
    res.status(500).json({ message: 'Failed to create vendor' });
  }
};

const updateVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone, company, status } = req.body || {};

    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const row = await prisma.vendor.update({
      where: { id },
      data: {
        ...(name != null && { name }),
        ...(email != null && { email }),
        ...(phone != null && { phone }),
        ...(company != null && { company }),
        ...(status != null && { status }),
      },
    });

    await logActivity('vendor', `Vendor #${id} updated`, { id });
    res.json(serialize(row));
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Failed to update vendor' });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await prisma.vendor.delete({ where: { id } });
    await logActivity('vendor', `Vendor #${id} deleted`, { id });
    res.json({ message: 'Vendor deleted' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ message: 'Failed to delete vendor' });
  }
};

const verifyVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await prisma.vendor.update({
      where: { id },
      data: { verified: true },
    });
    await logActivity('vendor', `Vendor #${id} verified`, { id });
    res.json(serialize(row));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    console.error('Verify vendor error:', error);
    res.status(500).json({ message: 'Failed to verify vendor' });
  }
};

const approveVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const row = await prisma.vendor.update({
      where: { id },
      data: { status: 'Approved', verified: true },
    });
    await logActivity('vendor', `Vendor #${id} approved`, { id });
    res.json(serialize(row));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    console.error('Approve vendor error:', error);
    res.status(500).json({ message: 'Failed to approve vendor' });
  }
};

const blacklistVendor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { blacklisted = true } = req.body || {};
    const row = await prisma.vendor.update({
      where: { id },
      data: {
        blacklisted: Boolean(blacklisted),
        status: blacklisted ? 'Blacklisted' : 'Approved',
      },
    });
    await logActivity('vendor', `Vendor #${id} blacklist=${blacklisted}`, { id });
    res.json(serialize(row));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    console.error('Blacklist vendor error:', error);
    res.status(500).json({ message: 'Failed to update blacklist status' });
  }
};

const updatePerformance = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { performance } = req.body || {};
    if (performance == null) {
      return res.status(400).json({ message: 'performance is required' });
    }

    const score = Math.max(0, Math.min(100, Number(performance)));
    const row = await prisma.vendor.update({
      where: { id },
      data: { performance: score },
    });
    await logActivity('vendor', `Vendor #${id} performance set to ${score}`, { id });
    res.json(serialize(row));
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    console.error('Update performance error:', error);
    res.status(500).json({ message: 'Failed to update performance' });
  }
};

const getPayoutsSummary = async (req, res) => {
  try {
    const agg = await prisma.vendor.aggregate({
      _sum: { pendingPayout: true, paidOut: true },
      _count: { _all: true },
    });

    res.json({
      vendorCount: agg._count._all,
      pendingPayoutTotal: toNumber(agg._sum.pendingPayout) || 0,
      paidOutTotal: toNumber(agg._sum.paidOut) || 0,
    });
  } catch (error) {
    console.error('Payouts summary error:', error);
    res.status(500).json({ message: 'Failed to load payouts summary' });
  }
};

module.exports = {
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  verifyVendor,
  approveVendor,
  blacklistVendor,
  updatePerformance,
  getPayoutsSummary,
};
