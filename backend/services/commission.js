const prisma = require('../config/prisma');

const COMMISSION_DEFAULT = 10;

async function getCommissionPercent() {
  const s = await prisma.setting.findFirst();
  return s?.commissionPercent ?? COMMISSION_DEFAULT;
}

module.exports = { getCommissionPercent, COMMISSION_DEFAULT };
