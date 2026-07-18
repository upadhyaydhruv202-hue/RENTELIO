const prisma = require('../config/prisma');
const { startOfDay } = require('../utils/serializers');

/**
 * Keep rental statuses aligned with calendar dates for both portals.
 */
async function syncLifecycleStatuses(customerId = null) {
  const today = startOfDay();
  const whereBase = customerId ? { customerId } : {};

  await prisma.rental.updateMany({
    where: {
      ...whereBase,
      status: { in: ['Active', 'Overdue'] },
      returnDate: { lt: today },
    },
    data: { status: 'Return Pending' },
  });

  await prisma.rental.updateMany({
    where: {
      ...whereBase,
      status: 'Requested',
      startDate: { lte: today },
      returnDate: { gte: today },
    },
    data: { status: 'Active' },
  });

  await prisma.rental.updateMany({
    where: { status: 'Overdue' },
    data: { status: 'Return Pending' },
  });
}

/**
 * Calculate late fee using org settings (grace period + daily rate + cap).
 */
async function calculateLateFee(rental, pricePerDay) {
  const settings = (await prisma.setting.findFirst()) || {
    lateFeePerDay: 0,
    gracePeriodHours: 0,
    maxLateFeePercent: 100,
  };

  const today = startOfDay();
  const expected = startOfDay(rental.returnDate);
  const graceMs = (Number(settings.gracePeriodHours) || 0) * 60 * 60 * 1000;
  const effectiveDue = new Date(expected.getTime() + graceMs);

  if (today <= effectiveDue) {
    return { lateDays: 0, lateFee: 0 };
  }

  const lateDays = Math.ceil((today - expected) / (1000 * 60 * 60 * 24));
  const dailyRate =
    Number(settings.lateFeePerDay) > 0
      ? Number(settings.lateFeePerDay)
      : Number(pricePerDay) || 0;
  let lateFee = lateDays * dailyRate;

  const depositAmount = Number(rental.deposit?.amount || 0);
  const maxPercent = Number(settings.maxLateFeePercent) || 100;
  if (depositAmount > 0) {
    const cap = (depositAmount * maxPercent) / 100;
    lateFee = Math.min(lateFee, cap);
  }

  return { lateDays, lateFee };
}

module.exports = { syncLifecycleStatuses, calculateLateFee };
