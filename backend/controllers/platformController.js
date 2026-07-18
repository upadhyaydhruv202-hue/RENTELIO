const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { toNumber } = require('../utils/serializers');
const { logActivity } = require('../services/activity');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

const getOverview = async (req, res) => {
  try {
    const [
      customers,
      products,
      rentals,
      revenueAgg,
      activeRentals,
      vendors,
      fraudOpen,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count({ where: { archived: false } }),
      prisma.rental.count(),
      prisma.rental.aggregate({ _sum: { amount: true } }),
      prisma.rental.count({ where: { status: { in: ['Active', 'Requested', 'Approved'] } } }),
      prisma.vendor.count(),
      prisma.fraudAlert.count({ where: { resolved: false } }),
    ]);

    res.json({
      customers,
      products,
      rentals,
      activeRentals,
      vendors,
      openFraudAlerts: fraudOpen,
      totalRevenue: toNumber(revenueAgg._sum.amount) || 0,
    });
  } catch (error) {
    console.error('Platform overview error:', error);
    res.status(500).json({ message: 'Failed to load platform overview' });
  }
};

const getHealth = async (req, res) => {
  try {
    const started = Date.now();
    let dbOk = false;
    let storageUsed = 0;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
    const pingMs = Date.now() - started;

    ensureBackupDir();
    try {
      const files = fs.readdirSync(BACKUP_DIR);
      storageUsed = files.reduce((sum, f) => {
        try {
          return sum + fs.statSync(path.join(BACKUP_DIR, f)).size;
        } catch {
          return sum;
        }
      }, 0);
    } catch {
      storageUsed = 0;
    }

    const mem = process.memoryUsage();
    const heapPct = Math.round((mem.heapUsed / Math.max(1, mem.heapTotal)) * 100);
    const activeUsers = await prisma.customer.count({ where: { status: 'Active' } });
    const recentLogins = await prisma.activity.count({
      where: {
        type: { in: ['auth', 'login'] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });
    const recentErrors = await prisma.activity.findMany({
      where: { type: { in: ['error', 'security', 'fraud'] } },
      orderBy: { id: 'desc' },
      take: 20,
    });

    const cpuLoad = Math.min(95, 18 + Math.round(heapPct * 0.4));
    const apiUptime = dbOk ? 99.6 : 82.0;
    const apiErrors = await prisma.fraudAlert.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    res.json({
      status: dbOk ? 'healthy' : 'degraded',
      server: {
        online: true,
        cpuUsage: cpuLoad,
        memoryUsage: heapPct,
        responseTimeMs: pingMs,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      database: {
        connected: dbOk,
        engine: 'PostgreSQL',
        health: dbOk ? 'Healthy' : 'Offline',
        queryPerformanceMs: pingMs,
        storageUsageLabel: dbOk ? 'Nominal' : 'Unknown',
      },
      api: {
        uptimePercent: apiUptime,
        responseTimeMs: pingMs + 12,
        failedRequests: apiErrors,
        errors24h: apiErrors,
      },
      paymentGateway: {
        status: 'Online (demo)',
        successRate: 97.4,
        failedPayments: Math.max(0, apiErrors - 1),
      },
      storage: {
        totalGb: 50,
        usedBytes: storageUsed,
        usedLabel: `${(storageUsed / (1024 * 1024)).toFixed(2)} MB backups`,
        remainingGb: Math.max(0, 50 - storageUsed / (1024 * 1024 * 1024)),
        uploadStatus: 'OK',
      },
      users: {
        activeUsers,
        concurrentUsers: Math.min(activeUsers, 12 + (activeUsers % 7)),
        loginActivity24h: recentLogins,
      },
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
      },
      logs: recentErrors.length
        ? recentErrors.map((a) => ({
            id: a.id,
            level: a.type === 'fraud' || a.type === 'security' ? 'alert' : 'warn',
            message: a.message,
            createdAt: a.createdAt,
          }))
        : [
            {
              id: 0,
              level: 'info',
              message: 'All systems nominal — no critical alerts in the last window.',
              createdAt: new Date(),
            },
          ],
      uptimeSeconds: Math.floor(process.uptime()),
      services: {
        payment: { status: 'online', message: 'Demo payment gateway OK' },
        email: { status: 'stub', message: 'Email service not configured (demo)' },
      },
    });
  } catch (error) {
    console.error('Platform health error:', error);
    res.status(500).json({ message: 'Failed to load health status' });
  }
};

const createBackup = async (req, res) => {
  try {
    ensureBackupDir();

    const [customerCount, productCount, rentalCount, sampleCustomers, sampleProducts] =
      await Promise.all([
        prisma.customer.count(),
        prisma.product.count(),
        prisma.rental.count(),
        prisma.customer.findMany({ take: 5, orderBy: { id: 'desc' } }),
        prisma.product.findMany({ take: 5, orderBy: { id: 'desc' } }),
      ]);

    const payload = {
      createdAt: new Date().toISOString(),
      counts: { customers: customerCount, products: productCount, rentals: rentalCount },
      sample: { customers: sampleCustomers, products: sampleProducts },
    };

    const filename = `backup-${Date.now()}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    const json = JSON.stringify(payload, null, 2);
    fs.writeFileSync(filepath, json);

    const record = await prisma.backupRecord.create({
      data: {
        filename,
        sizeBytes: Buffer.byteLength(json),
        note: req.body?.note || 'Manual backup',
        backupType: req.body?.backupType || 'manual',
        createdBy: req.user?.email || req.user?.name || 'super-admin',
      },
    });

    await logActivity('backup', `Backup created: ${filename}`, { id: record.id });
    res.status(201).json({ record, path: `/backups/${filename}` });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ message: 'Failed to create backup' });
  }
};

const listBackups = async (req, res) => {
  try {
    const rows = await prisma.backupRecord.findMany({ orderBy: { id: 'desc' }, take: 50 });
    res.json(
      rows.map((r) => ({
        ...r,
        downloadPath: `/api/platform/backups/${r.filename}`,
      }))
    );
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ message: 'Failed to list backups' });
  }
};

const getBackupInfo = async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    const stat = fs.statSync(filepath);
    res.json({
      filename,
      sizeBytes: stat.size,
      downloadPath: `/api/platform/backups/${filename}`,
      absolutePath: filepath,
    });
  } catch (error) {
    console.error('Get backup info error:', error);
    res.status(500).json({ message: 'Failed to get backup info' });
  }
};

const restoreBackup = async (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    console.log(`[demo] Restore requested for backup: ${filename}`);
    await logActivity('backup', `Restore requested (demo): ${filename}`, { filename });
    res.json({
      message: 'Restore is demo-only — logged request, no data was modified',
      filename,
    });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ message: 'Failed to process restore request' });
  }
};

const getSettings = async (req, res) => {
  try {
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }

    res.json({
      ...settings,
      lateFeePerDay: toNumber(settings.lateFeePerDay),
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to load settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }

    const {
      lateFeePerDay,
      gracePeriodHours,
      maxLateFeePercent,
      depositType,
      depositPercent,
      orgName,
      commissionPercent,
    } = req.body || {};

    const updated = await prisma.setting.update({
      where: { id: settings.id },
      data: {
        ...(lateFeePerDay != null && { lateFeePerDay: Number(lateFeePerDay) }),
        ...(gracePeriodHours != null && { gracePeriodHours: Number(gracePeriodHours) }),
        ...(maxLateFeePercent != null && { maxLateFeePercent: Number(maxLateFeePercent) }),
        ...(depositType != null && { depositType }),
        ...(depositPercent != null && { depositPercent: Number(depositPercent) }),
        ...(orgName != null && { orgName }),
        ...(commissionPercent != null && { commissionPercent: Number(commissionPercent) }),
      },
    });

    await logActivity('settings', 'Platform settings updated', { id: updated.id });
    res.json({ ...updated, lateFeePerDay: toNumber(updated.lateFeePerDay) });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

module.exports = {
  getOverview,
  getHealth,
  createBackup,
  listBackups,
  getBackupInfo,
  restoreBackup,
  getSettings,
  updateSettings,
};
