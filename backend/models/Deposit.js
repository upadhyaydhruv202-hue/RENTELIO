const prisma = require('../config/prisma');
const { serializeDeposit } = require('../utils/serializers');

const Deposit = {
  async findAll() {
    const deposits = await prisma.deposit.findMany({
      include: {
        rental: {
          include: { product: true, customer: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    return deposits.map((d) => ({
      ...serializeDeposit(d),
      customerName: d.rental?.customerName,
      productName: d.rental?.product?.name,
      rentalStatus: d.rental?.status,
      rentalId: d.rentalId,
    }));
  },

  async create({ rentalId, amount, status = 'Held' }) {
    return serializeDeposit(
      await prisma.deposit.create({
        data: {
          rentalId: Number(rentalId),
          amount: Number(amount),
          status,
          refundedAmount: 0,
          lateFeeDeducted: 0,
        },
      })
    );
  },

  async updateStatus(id, status, extra = {}) {
    try {
      return serializeDeposit(
        await prisma.deposit.update({
          where: { id: Number(id) },
          data: {
            status,
            ...(extra.refundedAmount != null && { refundedAmount: Number(extra.refundedAmount) }),
            ...(extra.lateFeeDeducted != null && {
              lateFeeDeducted: Number(extra.lateFeeDeducted),
            }),
          },
        })
      );
    } catch {
      return null;
    }
  },

  async updateStatusByRentalId(rentalId, status, extra = {}) {
    const existing = await prisma.deposit.findUnique({ where: { rentalId: Number(rentalId) } });
    if (!existing) return null;
    return this.updateStatus(existing.id, status, extra);
  },
};

module.exports = Deposit;
