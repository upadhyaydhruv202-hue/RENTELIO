const prisma = require('../config/prisma');
const { toNumber } = require('../utils/serializers');
const { logActivity } = require('../services/activity');
const { getCommissionPercent } = require('../services/commission');

function serializeSettlement(s) {
  return {
    ...s,
    rentalAmount: toNumber(s.rentalAmount),
    commission: toNumber(s.commission),
    taxDeduction: toNumber(s.taxDeduction),
    vendorAmount: toNumber(s.vendorAmount),
    vendor: s.vendor
      ? {
          id: s.vendor.id,
          name: s.vendor.name,
          company: s.vendor.company,
          email: s.vendor.email,
        }
      : undefined,
  };
}

const getSettlementDashboard = async (req, res) => {
  try {
    const commissionPercent = await getCommissionPercent();
    const [
      earningsAgg,
      pendingAgg,
      completedAgg,
      commissionAgg,
      failedCount,
      refundAgg,
      vendorEarnings,
      categoryCommission,
    ] = await Promise.all([
      prisma.settlement.aggregate({ _sum: { rentalAmount: true, vendorAmount: true } }),
      prisma.settlement.aggregate({
        where: { status: { in: ['Pending', 'Processing', 'On Hold'] } },
        _sum: { vendorAmount: true },
        _count: { _all: true },
      }),
      prisma.settlement.aggregate({
        where: { status: 'Completed' },
        _sum: { vendorAmount: true },
        _count: { _all: true },
      }),
      prisma.settlement.aggregate({ _sum: { commission: true } }),
      prisma.settlement.count({ where: { status: 'Failed' } }),
      prisma.deposit.aggregate({
        where: { status: { in: ['Refunded', 'Partial Refund'] } },
        _sum: { refundedAmount: true },
      }),
      prisma.settlement.groupBy({
        by: ['vendorId'],
        _sum: { vendorAmount: true, commission: true },
        _count: { _all: true },
        orderBy: { _sum: { vendorAmount: 'desc' } },
        take: 10,
      }),
      prisma.$queryRaw`
        SELECT COALESCE(p.category, 'General') AS category,
               COALESCE(SUM(s.commission), 0)::float AS commission,
               COUNT(s.id)::int AS settlements
        FROM settlements s
        LEFT JOIN rentals r ON r.id = s.rental_id
        LEFT JOIN products p ON p.id = r."productId"
        GROUP BY p.category
        ORDER BY commission DESC
        LIMIT 10
      `,
    ]);

    const vendorIds = vendorEarnings.map((v) => v.vendorId);
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, name: true, company: true },
    });
    const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v]));

    res.json({
      cards: {
        totalVendorEarnings: toNumber(earningsAgg._sum.vendorAmount) || 0,
        pendingSettlements: toNumber(pendingAgg._sum.vendorAmount) || 0,
        pendingCount: pendingAgg._count._all,
        completedPayouts: toNumber(completedAgg._sum.vendorAmount) || 0,
        completedCount: completedAgg._count._all,
        platformCommission: toNumber(commissionAgg._sum.commission) || 0,
        failedPayments: failedCount,
        refundAmount: toNumber(refundAgg._sum.refundedAmount) || 0,
        commissionPercent,
      },
      vendorEarnings: vendorEarnings.map((v) => ({
        vendorId: v.vendorId,
        name: vendorMap[v.vendorId]?.company || vendorMap[v.vendorId]?.name || `#${v.vendorId}`,
        amount: toNumber(v._sum.vendorAmount) || 0,
        commission: toNumber(v._sum.commission) || 0,
        count: v._count._all,
      })),
      categoryCommission: categoryCommission.map((c) => ({
        category: c.category,
        commission: Number(c.commission) || 0,
        settlements: Number(c.settlements) || 0,
      })),
    });
  } catch (error) {
    console.error('Settlement dashboard error:', error);
    res.status(500).json({ message: 'Failed to load settlement dashboard' });
  }
};

const listSettlements = async (req, res) => {
  try {
    const status = req.query.status;
    const q = String(req.query.search || '').trim();
    const where = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { settlementNo: { contains: q, mode: 'insensitive' } },
              { vendor: { name: { contains: q, mode: 'insensitive' } } },
              { vendor: { company: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const rows = await prisma.settlement.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { vendor: { select: { id: true, name: true, company: true, email: true } } },
      take: 200,
    });
    res.json(rows.map(serializeSettlement));
  } catch (error) {
    console.error('List settlements error:', error);
    res.status(500).json({ message: 'Failed to list settlements' });
  }
};

const updateSettlementStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { action, note } = req.body || {};
    const map = {
      approve: { status: 'Processing' },
      hold: { status: 'On Hold' },
      release: { status: 'Processing' },
      complete: { status: 'Completed', paidAt: new Date() },
      fail: { status: 'Failed' },
    };
    const data = map[action];
    if (!data) return res.status(400).json({ message: 'Invalid action' });
    if (note) data.note = note;

    const existing = await prisma.settlement.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Settlement not found' });

    const updated = await prisma.settlement.update({
      where: { id },
      data,
      include: { vendor: { select: { id: true, name: true, company: true, email: true } } },
    });

    if (action === 'complete' && existing.status !== 'Completed') {
      await prisma.vendor.update({
        where: { id: existing.vendorId },
        data: {
          pendingPayout: { decrement: toNumber(existing.vendorAmount) },
          paidOut: { increment: toNumber(existing.vendorAmount) },
        },
      });
    }

    await logActivity('settlement', `Settlement #${id} → ${data.status}`, { id, action });
    res.json(serializeSettlement(updated));
  } catch (error) {
    console.error('Update settlement error:', error);
    res.status(500).json({ message: 'Failed to update settlement' });
  }
};

module.exports = {
  getSettlementDashboard,
  listSettlements,
  updateSettlementStatus,
};
