const prisma = require('../config/prisma');
const { toNumber } = require('../utils/serializers');
const { logActivity } = require('../services/activity');

const getWallet = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const [customer, txns] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.walletTxn.findMany({
        where: { customerId },
        orderBy: { id: 'desc' },
        take: 50,
      }),
    ]);

    res.json({
      balance: toNumber(customer.walletBalance),
      transactions: txns.map((t) => ({
        ...t,
        amount: toNumber(t.amount),
        balanceAfter: toNumber(t.balanceAfter),
      })),
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Failed to load wallet' });
  }
};

const adminCredit = async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    const { amount, note } = req.body || {};

    if (amount == null || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Positive amount is required' });
    }

    const credit = Number(amount);
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const newBalance = toNumber(customer.walletBalance) + credit;
    const [updated, txn] = await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: { walletBalance: newBalance },
      }),
      prisma.walletTxn.create({
        data: {
          customerId,
          type: 'admin_credit',
          amount: credit,
          balanceAfter: newBalance,
          note: note || 'Admin wallet credit',
        },
      }),
    ]);

    await logActivity('wallet', `Admin credited ${credit} to customer #${customerId}`, {
      customerId,
      amount: credit,
    });

    res.json({
      balance: toNumber(updated.walletBalance),
      transaction: {
        ...txn,
        amount: toNumber(txn.amount),
        balanceAfter: toNumber(txn.balanceAfter),
      },
    });
  } catch (error) {
    console.error('Admin credit error:', error);
    res.status(500).json({ message: 'Failed to credit wallet' });
  }
};

module.exports = { getWallet, adminCredit };
