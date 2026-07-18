const prisma = require('../config/prisma');
const Rental = require('../models/Rental');
const { toNumber, serializeRental, rentalInclude, startOfDay } = require('../utils/serializers');

const getDashboard = async (req, res) => {
  try {
    await Rental.syncLifecycleStatuses();
    const today = startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalProducts,
      availableProducts,
      activeRentals,
      pendingReturns,
      overdueRentals,
      revenueAgg,
      depositsHeld,
      lateFeesAgg,
      statusGroups,
      recentRaw,
      dueToday,
      upcomingPickups,
      upcomingReturns,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'Available' } }),
      prisma.rental.count({ where: { status: { in: ['Active', 'Requested', 'Approved'] } } }),
      prisma.rental.count({
        where: { status: { in: ['Active', 'Return Pending', 'Requested', 'Approved'] } },
      }),
      prisma.rental.count({ where: { status: 'Return Pending' } }),
      prisma.rental.aggregate({ _sum: { amount: true } }),
      prisma.deposit.aggregate({
        where: { status: 'Held' },
        _sum: { amount: true },
      }),
      prisma.rental.aggregate({ _sum: { lateFee: true } }),
      prisma.rental.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.rental.findMany({
        include: rentalInclude,
        orderBy: { id: 'desc' },
        take: 8,
      }),
      prisma.rental.count({
        where: {
          status: { in: ['Active', 'Return Pending'] },
          returnDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.rental.count({
        where: {
          status: { in: ['Requested', 'Approved', 'Active'] },
          startDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.rental.count({
        where: {
          status: { in: ['Active', 'Return Pending'] },
          returnDate: { gte: today },
        },
      }),
    ]);

    const statusChart = {
      Requested: 0,
      Approved: 0,
      Active: 0,
      'Return Pending': 0,
      Completed: 0,
    };
    statusGroups.forEach((row) => {
      if (statusChart[row.status] !== undefined) {
        statusChart[row.status] = row._count._all;
      } else if (row.status === 'Overdue') {
        statusChart['Return Pending'] += row._count._all;
      }
    });

    res.json({
      stats: {
        totalProducts,
        availableProducts,
        activeRentals,
        pendingReturns,
        overdueRentals,
        dueToday,
        upcomingPickups,
        upcomingReturns,
        totalRevenue: toNumber(revenueAgg._sum.amount) || 0,
        depositsHeld: toNumber(depositsHeld._sum.amount) || 0,
        lateFeeCollected: toNumber(lateFeesAgg._sum.lateFee) || 0,
      },
      statusChart,
      recentRentals: recentRaw.map(serializeRental),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
};

const getReports = async (req, res) => {
  try {
    await Rental.syncLifecycleStatuses();

    const [
      revenueByStatus,
      categoryRevenue,
      depositSummary,
      topProducts,
      monthlyTrend,
    ] = await Promise.all([
      prisma.rental.groupBy({
        by: ['status'],
        _sum: { amount: true, lateFee: true },
        _count: { _all: true },
      }),
      prisma.$queryRaw`
        SELECT p.category,
               COUNT(r.id)::int AS rentals,
               COALESCE(SUM(r.amount), 0)::float AS revenue
        FROM rentals r
        JOIN products p ON p.id = r."productId"
        GROUP BY p.category
        ORDER BY revenue DESC
      `,
      prisma.deposit.groupBy({
        by: ['status'],
        _sum: { amount: true, refundedAmount: true, lateFeeDeducted: true },
        _count: { _all: true },
      }),
      prisma.$queryRaw`
        SELECT p.id, p.name, p.category,
               COUNT(r.id)::int AS rentals,
               COALESCE(SUM(r.amount), 0)::float AS revenue
        FROM rentals r
        JOIN products p ON p.id = r."productId"
        GROUP BY p.id, p.name, p.category
        ORDER BY rentals DESC
        LIMIT 8
      `,
      prisma.$queryRaw`
        SELECT to_char(r."created_at", 'YYYY-MM') AS month,
               COUNT(*)::int AS rentals,
               COALESCE(SUM(r.amount), 0)::float AS revenue
        FROM rentals r
        GROUP BY 1
        ORDER BY 1 DESC
        LIMIT 6
      `,
    ]);

    res.json({
      revenueByStatus: revenueByStatus.map((r) => ({
        status: r.status,
        count: r._count._all,
        revenue: toNumber(r._sum.amount) || 0,
        lateFees: toNumber(r._sum.lateFee) || 0,
      })),
      categoryRevenue,
      depositSummary: depositSummary.map((d) => ({
        status: d.status,
        count: d._count._all,
        amount: toNumber(d._sum.amount) || 0,
        refunded: toNumber(d._sum.refundedAmount) || 0,
        deducted: toNumber(d._sum.lateFeeDeducted) || 0,
      })),
      topProducts,
      monthlyTrend: [...monthlyTrend].reverse(),
    });
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ message: 'Failed to load reports' });
  }
};

module.exports = { getDashboard, getReports };
