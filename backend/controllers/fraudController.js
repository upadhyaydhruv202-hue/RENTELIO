const prisma = require('../config/prisma');
const { logActivity } = require('../services/activity');

const listAlerts = async (req, res) => {
  try {
    const resolved = req.query.resolved;
    const fraudType = req.query.fraudType;
    const where = {
      ...(resolved === 'true' ? { resolved: true } : {}),
      ...(resolved === 'false' ? { resolved: false } : {}),
      ...(fraudType ? { fraudType } : {}),
    };

    const rows = await prisma.fraudAlert.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 200,
    });
    res.json(rows);
  } catch (error) {
    console.error('List fraud alerts error:', error);
    res.status(500).json({ message: 'Failed to list fraud alerts' });
  }
};

const getFraudOverview = async (req, res) => {
  try {
    const [total, active, resolved, highRiskVendors, highRiskUsers, byType] = await Promise.all([
      prisma.fraudAlert.count(),
      prisma.fraudAlert.count({ where: { resolved: false } }),
      prisma.fraudAlert.count({ where: { resolved: true } }),
      prisma.vendor.count({ where: { OR: [{ fraudScore: { gte: 60 } }, { blacklisted: true }] } }),
      prisma.customer.count({
        where: { OR: [{ fraudScore: { gte: 60 } }, { status: { in: ['Banned', 'Suspended'] } }] },
      }),
      prisma.fraudAlert.groupBy({
        by: ['fraudType'],
        _count: { _all: true },
        orderBy: { _count: { fraudType: 'desc' } },
      }),
    ]);

    res.json({
      cards: {
        totalAttempts: total,
        activeCases: active,
        resolvedCases: resolved,
        highRiskAccounts: highRiskVendors + highRiskUsers,
      },
      categories: byType.map((b) => ({ type: b.fraudType || 'general', count: b._count._all })),
    });
  } catch (error) {
    console.error('Fraud overview error:', error);
    res.status(500).json({ message: 'Failed to load fraud overview' });
  }
};

const scanFraud = async (req, res) => {
  try {
    const created = [];

    const bannedCustomers = await prisma.customer.findMany({
      where: { status: 'Banned' },
      include: { rentals: { select: { id: true, status: true } } },
    });

    for (const customer of bannedCustomers) {
      const activeRentals = customer.rentals.filter((r) =>
        ['Active', 'Requested', 'Approved'].includes(r.status)
      );
      if (activeRentals.length > 0) {
        const alert = await prisma.fraudAlert.create({
          data: {
            severity: 'high',
            title: 'Banned customer with active rentals',
            detail: `Customer #${customer.id} (${customer.email}) is Banned but has ${activeRentals.length} active rental(s).`,
            fraudType: 'Suspicious booking patterns',
            entityType: 'user',
            entityId: customer.id,
            riskScore: 90,
          },
        });
        created.push(alert);
      }
    }

    const highCancelCustomers = await prisma.$queryRaw`
      SELECT c.id, c.email, c.name,
             COUNT(r.id)::int AS total,
             SUM(CASE WHEN r.status IN ('Cancelled', 'Rejected') THEN 1 ELSE 0 END)::int AS cancelled
      FROM customers c
      LEFT JOIN rentals r ON r."customerId" = c.id
      GROUP BY c.id, c.email, c.name
      HAVING COUNT(r.id) >= 3
         AND SUM(CASE WHEN r.status IN ('Cancelled', 'Rejected') THEN 1 ELSE 0 END)::float / COUNT(r.id) > 0.5
    `;

    for (const row of highCancelCustomers) {
      const alert = await prisma.fraudAlert.create({
        data: {
          severity: 'medium',
          title: 'High cancellation rate',
          detail: `Customer #${row.id} (${row.email}) has ${row.cancelled}/${row.total} cancelled rentals.`,
          fraudType: 'Suspicious booking patterns',
          entityType: 'user',
          entityId: Number(row.id),
          riskScore: 65,
        },
      });
      created.push(alert);
      await prisma.customer.update({
        where: { id: Number(row.id) },
        data: { fraudScore: { set: 65 } },
      });
    }

    const riskyVendors = await prisma.vendor.findMany({
      where: {
        OR: [
          { kycStatus: { in: ['Fraud Detected', 'Suspicious'] } },
          { failedKycAttempts: { gte: 2 } },
          { fraudScore: { gte: 70 } },
        ],
      },
      take: 20,
    });

    for (const vendor of riskyVendors) {
      const alert = await prisma.fraudAlert.create({
        data: {
          severity: vendor.kycStatus === 'Fraud Detected' ? 'critical' : 'high',
          title: `Vendor risk — ${vendor.company || vendor.name}`,
          detail: `KYC ${vendor.kycStatus}, fraud score ${vendor.fraudScore}, failed attempts ${vendor.failedKycAttempts}.`,
          fraudType:
            vendor.kycStatus === 'Fraud Detected' ? 'Fake documents' : 'Fake business identity',
          entityType: 'vendor',
          entityId: vendor.id,
          riskScore: vendor.fraudScore,
        },
      });
      created.push(alert);
    }

    const duplicatePhones = await prisma.$queryRaw`
      SELECT phone, COUNT(*)::int AS cnt
      FROM customers
      WHERE phone <> ''
      GROUP BY phone
      HAVING COUNT(*) > 1
    `;
    for (const row of duplicatePhones) {
      const alert = await prisma.fraudAlert.create({
        data: {
          severity: 'medium',
          title: 'Possible multiple accounts',
          detail: `Phone ${row.phone} is linked to ${row.cnt} customer accounts.`,
          fraudType: 'Multiple accounts',
          entityType: 'user',
          riskScore: 55,
        },
      });
      created.push(alert);
    }

    await logActivity('fraud', `Fraud scan completed: ${created.length} new alert(s)`, {
      count: created.length,
    });

    res.json({ scanned: true, created: created.length, alerts: created });
  } catch (error) {
    console.error('Fraud scan error:', error);
    res.status(500).json({ message: 'Failed to run fraud scan' });
  }
};

const resolveAlert = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { actionTaken = 'Marked resolved' } = req.body || {};
    const row = await prisma.fraudAlert.update({
      where: { id },
      data: { resolved: true, actionTaken },
    });

    await logActivity('fraud', `Fraud alert #${id} resolved`, { id });
    res.json(row);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Fraud alert not found' });
    }
    console.error('Resolve fraud alert error:', error);
    res.status(500).json({ message: 'Failed to resolve fraud alert' });
  }
};

const actOnAlert = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { action } = req.body || {};
    const alert = await prisma.fraudAlert.findUnique({ where: { id } });
    if (!alert) return res.status(404).json({ message: 'Fraud alert not found' });

    let actionTaken = action || 'investigated';

    if (alert.entityType === 'vendor' && alert.entityId) {
      if (action === 'suspend') {
        await prisma.vendor.update({
          where: { id: alert.entityId },
          data: { status: 'Suspended' },
        });
        actionTaken = 'Vendor suspended';
      } else if (action === 'blacklist') {
        await prisma.vendor.update({
          where: { id: alert.entityId },
          data: { blacklisted: true, status: 'Blacklisted', kycStatus: 'Blacklisted' },
        });
        actionTaken = 'Vendor blacklisted';
      }
    }

    if (alert.entityType === 'user' && alert.entityId) {
      if (action === 'suspend') {
        await prisma.customer.update({
          where: { id: alert.entityId },
          data: { status: 'Suspended' },
        });
        actionTaken = 'User suspended';
      } else if (action === 'blacklist') {
        await prisma.customer.update({
          where: { id: alert.entityId },
          data: { status: 'Banned', fraudScore: 99 },
        });
        actionTaken = 'User blacklisted';
      }
    }

    const updated = await prisma.fraudAlert.update({
      where: { id },
      data: {
        actionTaken,
        resolved: action === 'resolve',
      },
    });

    await logActivity('fraud', `Fraud alert #${id} action: ${actionTaken}`, { id, action });
    res.json(updated);
  } catch (error) {
    console.error('Fraud act error:', error);
    res.status(500).json({ message: 'Failed to act on fraud alert' });
  }
};

module.exports = { listAlerts, getFraudOverview, scanFraud, resolveAlert, actOnAlert };
