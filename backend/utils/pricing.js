/** Security Deposit = Rental Price Per Day × 1.5 */
const DEPOSIT_MULTIPLIER = 1.5;

function calcSecurityDeposit(pricePerDay) {
  const price = Number(pricePerDay);
  if (!Number.isFinite(price) || price < 0) return 0;
  // Keep 2 decimal places for money consistency with Prisma Decimal
  return Math.round(price * DEPOSIT_MULTIPLIER * 100) / 100;
}

module.exports = { DEPOSIT_MULTIPLIER, calcSecurityDeposit };
