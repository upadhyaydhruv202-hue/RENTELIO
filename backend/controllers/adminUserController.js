const prisma = require('../config/prisma');
const { toNumber } = require('../utils/serializers');
const { logActivity } = require('../services/activity');

const ALLOWED_STATUSES = ['Active', 'Suspended', 'Banned'];

const listCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        verified: true,
        walletBalance: true,
        createdAt: true,
      },
    });

    res.json(
      customers.map((c) => ({
        ...c,
        walletBalance: toNumber(c.walletBalance),
      }))
    );
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ message: 'Failed to list customers' });
  }
};

const setStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { status },
    });

    await logActivity('customer', `Customer #${id} status set to ${status}`, { id, status });
    res.json({ ...customer, walletBalance: toNumber(customer.walletBalance) });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    console.error('Set customer status error:', error);
    res.status(500).json({ message: 'Failed to update customer status' });
  }
};

const verifyIdentity = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { idDocumentUrl } = req.body || {};

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        verified: true,
        ...(idDocumentUrl != null && { idDocumentUrl }),
      },
    });

    await logActivity('customer', `Customer #${id} identity verified`, { id });
    res.json({ ...customer, walletBalance: toNumber(customer.walletBalance) });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    console.error('Verify identity error:', error);
    res.status(500).json({ message: 'Failed to verify customer identity' });
  }
};

module.exports = { listCustomers, setStatus, verifyIdentity };
