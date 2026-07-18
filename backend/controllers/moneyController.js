const prisma = require('../config/prisma');
const { toNumber, serializeDeposit } = require('../utils/serializers');
const { logActivity } = require('../services/activity');
const { calculateLateFee } = require('../services/rentalLifecycle');

const depositStatusSummary = async (status) => {
  const agg = await prisma.deposit.groupBy({
    by: ['status'],
    where: status ? { status } : undefined,
    _count: { _all: true },
    _sum: { amount: true, refundedAmount: true },
  });

  const row = agg.find((r) => r.status === status) || { _count: { _all: 0 }, _sum: { amount: 0 } };
  return {
    count: row._count._all,
    sum: toNumber(row._sum.amount) || 0,
    refundedSum: toNumber(row._sum.refundedAmount) || 0,
  };
};

const getWalletSummary = async (req, res) => {
  try {
    const [held, refunded, pendingRefund, forfeited] = await Promise.all([
      depositStatusSummary('Held'),
      depositStatusSummary('Refunded'),
      depositStatusSummary('Pending Refund'),
      depositStatusSummary('Forfeited'),
    ]);

    res.json({ held, refunded, pendingRefund, forfeited });
  } catch (error) {
    console.error('Wallet summary error:', error);
    res.status(500).json({ message: 'Failed to load wallet summary' });
  }
};

const getDepositHistory = async (req, res) => {
  try {
    const depositId = req.query.depositId ? Number(req.query.depositId) : null;

    const deposits = await prisma.deposit.findMany({
      where: depositId ? { id: depositId } : undefined,
      include: {
        events: { orderBy: { id: 'desc' } },
        rental: {
          include: {
            product: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
      take: depositId ? 1 : 100,
    });

    res.json(
      deposits.map((d) => ({
        ...serializeDeposit(d),
        events: d.events.map((e) => ({ ...e, amount: toNumber(e.amount) })),
        rental: d.rental,
      }))
    );
  } catch (error) {
    console.error('Deposit history error:', error);
    res.status(500).json({ message: 'Failed to load deposit history' });
  }
};

const requestRefund = async (req, res) => {
  try {
    const depositId = Number(req.params.depositId);
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { rental: true },
    });

    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }
    if (deposit.status !== 'Held') {
      return res.status(400).json({ message: 'Only held deposits can be refunded' });
    }

    const updated = await prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'Pending Refund' },
    });

    await prisma.depositEvent.create({
      data: {
        depositId,
        type: 'Refund Requested',
        amount: deposit.amount,
        note: req.body?.note || 'Customer requested refund',
      },
    });

    await logActivity('deposit', `Refund requested for deposit #${depositId}`, { depositId });
    res.json(serializeDeposit(updated));
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({ message: 'Failed to request refund' });
  }
};

const approveRefund = async (req, res) => {
  try {
    const depositId = Number(req.params.depositId);
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: { rental: { include: { customer: true, product: true } } },
    });

    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }
    if (deposit.status !== 'Pending Refund' && deposit.status !== 'Held') {
      return res.status(400).json({ message: 'Deposit is not eligible for refund approval' });
    }

    const refundAmount = toNumber(deposit.amount) - toNumber(deposit.lateFeeDeducted);
    const customerId = deposit.rental?.customerId;

    const updated = await prisma.$transaction(async (tx) => {
      const dep = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: 'Refunded',
          refundedAmount: refundAmount,
        },
      });

      await tx.depositEvent.create({
        data: {
          depositId,
          type: 'Refund Approved',
          amount: refundAmount,
          note: req.body?.note || 'Refund approved by staff',
        },
      });

      if (customerId && refundAmount > 0) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        const newBalance = toNumber(customer.walletBalance) + refundAmount;
        await tx.customer.update({
          where: { id: customerId },
          data: { walletBalance: newBalance },
        });
        await tx.walletTxn.create({
          data: {
            customerId,
            type: 'credit',
            amount: refundAmount,
            balanceAfter: newBalance,
            note: `Deposit refund for rental #${deposit.rentalId}`,
          },
        });
      }

      return dep;
    });

    await logActivity('deposit', `Refund approved for deposit #${depositId}`, {
      depositId,
      refundAmount,
    });
    res.json(serializeDeposit(updated));
  } catch (error) {
    console.error('Approve refund error:', error);
    res.status(500).json({ message: 'Failed to approve refund' });
  }
};

const calcPenalties = async (req, res) => {
  try {
    const rentalId = Number(req.params.rentalId);
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { deposit: true, product: true },
    });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const { lateDays, lateFee } = await calculateLateFee(
      rental,
      toNumber(rental.product?.pricePerDay)
    );
    const depositAmount = toNumber(rental.deposit?.amount) || 0;
    const damageCharge = toNumber(rental.damageCharge) || 0;

    res.json({
      rentalId,
      lateDays,
      lateFee,
      damageCharge,
      depositAmount,
      estimatedDeduction: Math.min(depositAmount, lateFee + damageCharge),
      estimatedRefund: Math.max(0, depositAmount - lateFee - damageCharge),
    });
  } catch (error) {
    console.error('Calc penalties error:', error);
    res.status(500).json({ message: 'Failed to calculate penalties' });
  }
};

module.exports = {
  getWalletSummary,
  getDepositHistory,
  requestRefund,
  approveRefund,
  calcPenalties,
};
