const prisma = require('../config/prisma');
const Rental = require('../models/Rental');
const { toNumber, startOfDay } = require('../utils/serializers');

const PROFIT_MARGIN = 0.35;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatLabel = (date, mode) => {
  const d = new Date(date);
  if (mode === 'daily') return d.toISOString().slice(0, 10);
  if (mode === 'weekly') {
    const weekStart = startOfDay(d);
    return weekStart.toISOString().slice(0, 10);
  }
  if (mode === 'monthly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  return String(d.getFullYear());
};

async function revenueForRange(from, to) {
  const agg = await prisma.rental.aggregate({
    where: { createdAt: { gte: from, lt: to } },
    _sum: { amount: true },
  });
  return toNumber(agg._sum.amount) || 0;
}

async function buildRevenueSeries(mode, count, stepDays) {
  const series = [];
  const today = startOfDay();

  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(today);
    start.setDate(start.getDate() - i * stepDays);
    const end = new Date(start);
    end.setDate(end.getDate() + stepDays);

    const value = await revenueForRange(start, end);
    series.push({ label: formatLabel(start, mode), value });
  }
  return series;
}

const getDashboardV2 = async (req, res) => {
  try {
    await Rental.syncLifecycleStatuses();

    const today = startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const dayStart = startOfDay();
    const weekStart = new Date(dayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(dayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);
    const yearStart = new Date(dayStart);
    yearStart.setFullYear(yearStart.getFullYear() - 1);

    const [
      totalRentals,
      activeRentals,
      overdueRentals,
      pendingPickups,
      pendingReturns,
      availableProducts,
      underMaintenance,
      revenueAgg,
      depositsHeldAgg,
      reservedProductsAgg,
      rentedProductsAgg,
      profitDaily,
      profitWeekly,
      profitMonthly,
      profitYearly,
      revenueSeriesDaily,
      revenueSeriesWeekly,
      revenueSeriesMonthly,
      revenueSeriesYearly,
      topProducts,
      rentalsForHeatmap,
      categoryGroups,
      activities,
      quotations,
    ] = await Promise.all([
      prisma.rental.count(),
      prisma.rental.count({
        where: { status: { in: ['Active', 'Requested', 'Approved'] } },
      }),
      prisma.rental.count({ where: { status: { in: ['Return Pending', 'Overdue'] } } }),
      prisma.rental.count({
        where: {
          pickupStatus: { in: ['Scheduled', 'Pending'] },
          scheduledPickup: { gte: today, lt: weekEnd },
        },
      }),
      prisma.rental.count({
        where: { returnStatus: { in: ['Pending', 'Scheduled'] }, status: { not: 'Completed' } },
      }),
      prisma.product.count({
        where: { status: 'Available', archived: false, maintenanceStatus: { not: 'UnderMaintenance' } },
      }),
      prisma.product.count({ where: { maintenanceStatus: 'UnderMaintenance' } }),
      prisma.rental.aggregate({ _sum: { amount: true } }),
      prisma.deposit.aggregate({ where: { status: 'Held' }, _sum: { amount: true } }),
      prisma.product.aggregate({ _sum: { reservedQty: true } }),
      prisma.product.count({ where: { status: 'Rented' } }),
      revenueForRange(dayStart, tomorrow),
      revenueForRange(weekStart, tomorrow),
      revenueForRange(monthStart, tomorrow),
      revenueForRange(yearStart, tomorrow),
      buildRevenueSeries('daily', 7, 1),
      buildRevenueSeries('weekly', 8, 7),
      (async () => {
        const series = [];
        for (let i = 5; i >= 0; i -= 1) {
          const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
          const value = await revenueForRange(start, end);
          series.push({ label: formatLabel(start, 'monthly'), value });
        }
        return series;
      })(),
      (async () => {
        const series = [];
        for (let i = 3; i >= 0; i -= 1) {
          const year = today.getFullYear() - i;
          const start = new Date(year, 0, 1);
          const end = new Date(year + 1, 0, 1);
          const value = await revenueForRange(start, end);
          series.push({ label: formatLabel(start, 'yearly'), value });
        }
        return series;
      })(),
      prisma.$queryRaw`
        SELECT p.name, COUNT(r.id)::int AS count
        FROM rentals r
        JOIN products p ON p.id = r."productId"
        GROUP BY p.name
        ORDER BY count DESC
        LIMIT 5
      `,
      prisma.rental.findMany({
        select: { createdAt: true },
        orderBy: { id: 'desc' },
        take: 500,
      }),
      prisma.product.groupBy({
        by: ['category'],
        _count: { _all: true },
        orderBy: { _count: { category: 'desc' } },
        take: 8,
      }),
      prisma.activity.findMany({ orderBy: { id: 'desc' }, take: 20 }),
      prisma.quotation.findMany({
        orderBy: { id: 'desc' },
        take: 10,
        include: { customer: { select: { id: true, name: true, email: true } }, product: true },
      }),
    ]);

    const totalRevenue = toNumber(revenueAgg._sum.amount) || 0;
    const totalProfit = Math.round(totalRevenue * PROFIT_MARGIN * 100) / 100;
    const depositsHeld = toNumber(depositsHeldAgg._sum.amount) || 0;
    const reservedProducts = toNumber(reservedProductsAgg._sum.reservedQty) || 0;

    const rentedCount = rentedProductsAgg;
    const maintenanceCount = underMaintenance;
    const availableCount = availableProducts;

    const dayCounts = DAY_NAMES.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});
    const hourCounts = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));

    rentalsForHeatmap.forEach((r) => {
      const d = new Date(r.createdAt);
      const dayName = DAY_NAMES[d.getDay()];
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
      hourCounts[d.getHours()].count += 1;
    });

    res.json({
      stats: {
        totalRentals,
        activeRentals,
        overdueRentals,
        pendingPickups,
        pendingReturns,
        availableProducts: availableCount,
        underMaintenance: maintenanceCount,
        totalRevenue,
        totalProfit,
        depositsHeld,
        reservedProducts,
        rentedProducts: rentedCount,
      },
      profit: {
        daily: profitDaily,
        weekly: profitWeekly,
        monthly: profitMonthly,
        yearly: profitYearly,
      },
      revenueSeries: {
        daily: revenueSeriesDaily,
        weekly: revenueSeriesWeekly,
        monthly: revenueSeriesMonthly,
        yearly: revenueSeriesYearly,
      },
      inventoryMix: {
        available: availableCount,
        rented: rentedCount,
        maintenance: maintenanceCount,
        reserved: reservedProducts,
      },
      heatmap: {
        products: topProducts.map((p) => ({ name: p.name, count: Number(p.count) })),
        days: dayCounts,
        hours: hourCounts,
        categories: categoryGroups.map((c) => ({
          category: c.category,
          count: c._count._all,
        })),
      },
      activities,
      quotations: quotations.map((q) => ({
        ...q,
        offeredAmount: toNumber(q.offeredAmount),
        counterAmount: q.counterAmount != null ? toNumber(q.counterAmount) : null,
      })),
    });
  } catch (error) {
    console.error('Dashboard v2 error:', error);
    res.status(500).json({ message: 'Failed to load dashboard v2' });
  }
};

module.exports = { getDashboardV2 };
