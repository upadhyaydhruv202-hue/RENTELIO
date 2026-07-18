const prisma = require('../config/prisma');
const { toNumber, startOfDay } = require('../utils/serializers');
const { evaluateVendorKyc } = require('../services/kycDemo');
const { logActivity } = require('../services/activity');
const { getCommissionPercent } = require('../services/commission');

const getControlCenter = async (req, res) => {
  try {
    const today = startOfDay();
    const commissionPct = await getCommissionPercent();

    const [
      totalUsers,
      verifiedVendors,
      pendingVendors,
      activeRentals,
      completedRentals,
      cancelledRentals,
      revenueAgg,
      pendingPayouts,
      paidOutAgg,
      openFraud,
      blacklistedVendors,
      bannedUsers,
      activities,
      recentVendors,
      recentUsers,
      categoryGroups,
      topVendorsRaw,
      rentalsTrend,
      settlementsPending,
      settlementsCompleted,
      commissionAgg,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.vendor.count({ where: { verified: true, blacklisted: false } }),
      prisma.vendor.count({ where: { status: 'Pending', blacklisted: false } }),
      prisma.rental.count({ where: { status: { in: ['Active', 'Requested', 'Approved'] } } }),
      prisma.rental.count({ where: { status: 'Completed' } }),
      prisma.rental.count({ where: { status: 'Cancelled' } }),
      prisma.rental.aggregate({ _sum: { amount: true } }),
      prisma.vendor.aggregate({ _sum: { pendingPayout: true } }),
      prisma.vendor.aggregate({ _sum: { paidOut: true } }),
      prisma.fraudAlert.count({ where: { resolved: false } }),
      prisma.vendor.count({ where: { blacklisted: true } }),
      prisma.customer.count({ where: { status: { in: ['Banned', 'Suspended'] } } }),
      prisma.activity.findMany({ orderBy: { id: 'desc' }, take: 25 }),
      prisma.vendor.findMany({ orderBy: { id: 'desc' }, take: 5 }),
      prisma.customer.findMany({ orderBy: { id: 'desc' }, take: 5 }),
      prisma.product.groupBy({ by: ['category'], _count: { _all: true }, orderBy: { _count: { category: 'desc' } }, take: 8 }),
      prisma.$queryRaw`
        SELECT v.id, v.company, v.name, COUNT(r.id)::int AS rentals,
               COALESCE(SUM(r.amount),0)::float AS revenue
        FROM vendors v
        LEFT JOIN products p ON p."vendor_id" = v.id
        LEFT JOIN rentals r ON r."productId" = p.id
        GROUP BY v.id, v.company, v.name
        ORDER BY revenue DESC
        LIMIT 8
      `,
      prisma.rental.findMany({
        select: { createdAt: true, amount: true, status: true },
        orderBy: { id: 'desc' },
        take: 400,
      }),
      prisma.settlement.aggregate({ where: { status: { in: ['Pending', 'Processing', 'On Hold'] } }, _sum: { vendorAmount: true }, _count: { _all: true } }),
      prisma.settlement.aggregate({ where: { status: 'Completed' }, _sum: { vendorAmount: true, commission: true } }),
      prisma.settlement.aggregate({ _sum: { commission: true } }),
    ]);

    const totalRevenue = toNumber(revenueAgg._sum.amount) || 0;
    const platformCommission =
      toNumber(commissionAgg._sum.commission) ||
      Math.round(totalRevenue * (commissionPct / 100) * 100) / 100;

    // Daily series last 14 days
    const rentalActivity = [];
    const userGrowth = [];
    for (let i = 13; i >= 0; i -= 1) {
      const start = new Date(today);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const dayRentals = rentalsTrend.filter((r) => {
        const d = new Date(r.createdAt);
        return d >= start && d < end;
      });
      rentalActivity.push({
        label: start.toISOString().slice(5, 10),
        value: dayRentals.length,
        revenue: dayRentals.reduce((s, r) => s + (toNumber(r.amount) || 0), 0),
      });
      userGrowth.push({
        label: start.toISOString().slice(5, 10),
        value: Math.max(0, totalUsers - i),
      });
    }

    const requested = rentalsTrend.filter((r) => r.status === 'Requested').length;
    const booked = rentalsTrend.filter((r) =>
      ['Active', 'Completed', 'Approved', 'Return Pending'].includes(r.status)
    ).length;
    const conversionRate =
      rentalsTrend.length > 0
        ? Math.round((booked / Math.max(1, rentalsTrend.length)) * 1000) / 10
        : 0;

    const highRiskVendors = await prisma.vendor.count({ where: { fraudScore: { gte: 60 } } });
    const highRiskUsers = await prisma.customer.count({ where: { fraudScore: { gte: 60 } } });

    const predictedRevenue = Math.round(totalRevenue * 1.08);
    const aiInsights = [
      {
        type: 'summary',
        title: 'Daily business summary',
        body: `${activeRentals} active rentals · ₹${Math.round(totalRevenue).toLocaleString('en-IN')} GMV · ${pendingVendors} vendors awaiting KYC.`,
      },
      {
        type: 'alert',
        title: 'Suspicious activity',
        body: `${openFraud} open fraud cases · ${highRiskVendors} high-risk vendors · ${highRiskUsers} high-risk users.`,
      },
      {
        type: 'prediction',
        title: 'Revenue outlook',
        body: `Demo model projects ~₹${predictedRevenue.toLocaleString('en-IN')} next period (+8% trail).`,
      },
      {
        type: 'vendor',
        title: 'Vendor performance',
        body: topVendorsRaw[0]
          ? `${topVendorsRaw[0].company || topVendorsRaw[0].name} leads with ₹${Math.round(topVendorsRaw[0].revenue || 0).toLocaleString('en-IN')} rental GMV.`
          : 'No vendor revenue yet.',
      },
      {
        type: 'engagement',
        title: 'User engagement',
        body: `Booking conversion ~${conversionRate}% · ${totalUsers} registered users · commission run-rate ${commissionPct}%.`,
      },
    ];

    const locationStats = await prisma.vendor.groupBy({
      by: ['location'],
      _count: { _all: true },
      orderBy: { _count: { location: 'desc' } },
      take: 8,
    });

    res.json({
      cards: {
        totalUsers,
        verifiedVendors,
        pendingVendorVerification: pendingVendors,
        activeRentals,
        completedRentals,
        cancelledRentals,
        totalRevenue,
        platformCommission,
        pendingPayouts: toNumber(pendingPayouts._sum.pendingPayout) || 0,
        paidOut: toNumber(paidOutAgg._sum.paidOut) || 0,
        fraudCases: openFraud,
        blacklisted:
          blacklistedVendors + bannedUsers,
        settlementsPendingCount: settlementsPending._count._all,
        settlementsPendingAmount: toNumber(settlementsPending._sum.vendorAmount) || 0,
        settlementsCompletedAmount: toNumber(settlementsCompleted._sum.vendorAmount) || 0,
      },
      charts: {
        rentalActivity,
        userGrowth,
        vendorGrowth: userGrowth.map((g, i) => ({
          label: g.label,
          value: Math.max(1, verifiedVendors - (13 - i)),
        })),
        revenueTrends: rentalActivity.map((r) => ({ label: r.label, value: r.revenue })),
        commissionEarnings: rentalActivity.map((r) => ({
          label: r.label,
          value: Math.round(r.revenue * (commissionPct / 100)),
        })),
        topVendors: topVendorsRaw.map((v) => ({
          id: v.id,
          name: v.company || v.name,
          rentals: Number(v.rentals),
          revenue: Number(v.revenue) || 0,
        })),
        categories: categoryGroups.map((c) => ({
          category: c.category,
          count: c._count._all,
        })),
        locations: locationStats
          .filter((l) => l.location)
          .map((l) => ({ location: l.location || 'Unknown', count: l._count._all })),
      },
      conversionRate,
      commissionPercent: commissionPct,
      aiInsights,
      recent: {
        activities,
        vendors: recentVendors.map((v) => ({
          id: v.id,
          company: v.company,
          name: v.name,
          status: v.status,
          kycStatus: v.kycStatus,
          createdAt: v.createdAt,
        })),
        users: recentUsers.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          status: u.status,
          verified: u.verified,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Control center error:', error);
    res.status(500).json({ message: 'Failed to load Super Admin overview' });
  }
};

const runVendorKyc = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const result = evaluateVendorKyc(vendor);
    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        kycStatus: result.kycStatus,
        fraudScore: result.fraudScore,
        kycNotes: result.summary,
        failedKycAttempts:
          result.kycStatus === 'Fraud Detected' || result.kycStatus === 'Suspicious'
            ? { increment: 1 }
            : undefined,
      },
    });

    if (result.kycStatus === 'Fraud Detected') {
      await prisma.fraudAlert.create({
        data: {
          severity: 'high',
          title: `KYC fraud — ${vendor.company || vendor.name}`,
          detail: result.summary,
          fraudType: 'Fake documents',
          entityType: 'vendor',
          entityId: id,
          riskScore: result.fraudScore,
        },
      });
    }

    await logActivity('kyc', `KYC scan vendor #${id}: ${result.kycStatus}`, { vendorId: id });
    const { password, ...safe } = updated;
    res.json({ vendor: safe, evaluation: result });
  } catch (error) {
    console.error('KYC run error:', error);
    res.status(500).json({ message: 'KYC evaluation failed' });
  }
};

const setVendorKycDecision = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { decision, notes } = req.body || {};
    const map = {
      approve: { kycStatus: 'Verified', verified: true, status: 'Approved' },
      reject: { kycStatus: 'Pending Review', verified: false, status: 'Pending' },
      request_docs: { kycStatus: 'Pending Review' },
      fraud: { kycStatus: 'Fraud Detected', fraudScore: 95, blacklisted: true, status: 'Blacklisted' },
      blacklist: { kycStatus: 'Blacklisted', blacklisted: true, status: 'Blacklisted' },
    };
    const data = map[decision];
    if (!data) return res.status(400).json({ message: 'Invalid decision' });
    if (notes) data.kycNotes = notes;

    const updated = await prisma.vendor.update({ where: { id }, data });
    await logActivity('kyc', `Vendor #${id} KYC decision: ${decision}`, { vendorId: id });
    const { password, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    console.error('KYC decision error:', error);
    res.status(500).json({ message: 'Failed to update KYC decision' });
  }
};

const listVendorsAdmin = async (req, res) => {
  try {
    const q = String(req.query.search || '').trim();
    const status = req.query.status;
    const kycStatus = req.query.kycStatus;
    const where = {
      ...(status ? { status } : {}),
      ...(kycStatus ? { kycStatus } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { company: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { location: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { id: 'desc' },
      include: { _count: { select: { products: true } } },
    });

    res.json(
      vendors.map((v) => {
        const { password, ...rest } = v;
        return {
          ...rest,
          pendingPayout: toNumber(v.pendingPayout),
          paidOut: toNumber(v.paidOut),
          lateFeeAmount: toNumber(v.lateFeeAmount),
          itemsCount: v._count.products,
          rating: Math.min(5, Math.round((v.performance / 20) * 10) / 10),
        };
      })
    );
  } catch (error) {
    console.error('List vendors admin error:', error);
    res.status(500).json({ message: 'Failed to list vendors' });
  }
};

const listUsersAdmin = async (req, res) => {
  try {
    const q = String(req.query.search || '').trim();
    const status = req.query.status;
    const where = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const users = await prisma.customer.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        rentals: { select: { id: true, amount: true, status: true } },
      },
    });

    res.json(
      users.map((u) => {
        const { password, rentals, ...rest } = u;
        const spend = rentals.reduce((s, r) => s + (toNumber(r.amount) || 0), 0);
        return {
          ...rest,
          walletBalance: toNumber(u.walletBalance),
          totalRentals: rentals.length,
          spendingAmount: spend,
          rating: u.verified ? 4.5 : 3.8,
        };
      })
    );
  } catch (error) {
    console.error('List users admin error:', error);
    res.status(500).json({ message: 'Failed to list users' });
  }
};

module.exports = {
  getControlCenter,
  runVendorKyc,
  setVendorKycDecision,
  listVendorsAdmin,
  listUsersAdmin,
};
