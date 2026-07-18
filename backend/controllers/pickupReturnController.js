const prisma = require('../config/prisma');
const { serializeRental, rentalInclude } = require('../utils/serializers');
const { logActivity } = require('../services/activity');

const TRACKER_STAGES = [
  'Pickup Assigned',
  'Driver En Route',
  'Picked Up',
  'Delivered',
  'Returned',
  'Inspection Completed',
];

const OTP_REQUIRED_STAGES = new Set(['Picked Up', 'Returned']);

const randomOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const buildScheduleWhere = (filter, from, to) => {
  const where = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (filter === 'today') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    where.OR = [
      { scheduledPickup: { gte: today, lt: tomorrow } },
      { scheduledReturn: { gte: today, lt: tomorrow } },
    ];
  } else if (filter === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    where.OR = [
      { scheduledPickup: { gte: tomorrow, lt: dayAfter } },
      { scheduledReturn: { gte: tomorrow, lt: dayAfter } },
    ];
  } else if (filter === 'week') {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    where.OR = [
      { scheduledPickup: { gte: today, lt: weekEnd } },
      { scheduledReturn: { gte: today, lt: weekEnd } },
    ];
  } else if (filter === 'custom' && from && to) {
    const start = new Date(from);
    const end = new Date(to);
    end.setDate(end.getDate() + 1);
    where.OR = [
      { scheduledPickup: { gte: start, lt: end } },
      { scheduledReturn: { gte: start, lt: end } },
    ];
  }

  return where;
};

const listSchedule = async (req, res) => {
  try {
    const filter = req.query.filter || 'week';
    const where = buildScheduleWhere(filter, req.query.from, req.query.to);

    const rentals = await prisma.rental.findMany({
      where,
      include: rentalInclude,
      orderBy: [{ scheduledPickup: 'asc' }, { scheduledReturn: 'asc' }],
    });

    res.json(rentals.map(serializeRental));
  } catch (error) {
    console.error('List schedule error:', error);
    res.status(500).json({ message: 'Failed to load pickup/return schedule' });
  }
};

const generateOtps = async (req, res) => {
  try {
    const rentalId = Number(req.params.rentalId);
    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const pickupOtp = randomOtp();
    const returnOtp = randomOtp();

    const updated = await prisma.rental.update({
      where: { id: rentalId },
      data: { pickupOtp, returnOtp },
      include: rentalInclude,
    });

    await logActivity('pickup', `OTPs generated for rental #${rentalId}`, { rentalId });
    res.json(serializeRental(updated));
  } catch (error) {
    console.error('Generate OTPs error:', error);
    res.status(500).json({ message: 'Failed to generate OTPs' });
  }
};

const verifyPickupOtp = async (req, res) => {
  try {
    const rentalId = Number(req.params.rentalId);
    const { otp } = req.body || {};
    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }
    if (!otp || String(otp) !== rental.pickupOtp) {
      return res.status(400).json({ message: 'Invalid pickup OTP' });
    }

    const updated = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        trackerStage: 'Picked Up',
        pickupStatus: 'Completed',
        pickupAt: new Date(),
      },
      include: rentalInclude,
    });

    await logActivity('pickup', `Pickup verified for rental #${rentalId}`, { rentalId });
    res.json(serializeRental(updated));
  } catch (error) {
    console.error('Verify pickup OTP error:', error);
    res.status(500).json({ message: 'Failed to verify pickup OTP' });
  }
};

const verifyReturnOtp = async (req, res) => {
  try {
    const rentalId = Number(req.params.rentalId);
    const { otp } = req.body || {};
    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }
    if (!otp || String(otp) !== rental.returnOtp) {
      return res.status(400).json({ message: 'Invalid return OTP' });
    }

    const updated = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        trackerStage: 'Returned',
        returnStatus: 'Completed',
        returnedAt: new Date(),
        status: 'Completed',
      },
      include: rentalInclude,
    });

    await logActivity('return', `Return verified for rental #${rentalId}`, { rentalId });
    res.json(serializeRental(updated));
  } catch (error) {
    console.error('Verify return OTP error:', error);
    res.status(500).json({ message: 'Failed to verify return OTP' });
  }
};

const advanceTracker = async (req, res) => {
  try {
    const rentalId = Number(req.params.rentalId);
    const { stage, otp } = req.body || {};

    if (!stage || !TRACKER_STAGES.includes(stage)) {
      return res.status(400).json({ message: 'Invalid tracker stage' });
    }

    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (OTP_REQUIRED_STAGES.has(stage)) {
      const expected = stage === 'Picked Up' ? rental.pickupOtp : rental.returnOtp;
      if (!otp || String(otp) !== expected) {
        return res.status(400).json({ message: `OTP required for stage: ${stage}` });
      }
    }

    const data = { trackerStage: stage };
    if (stage === 'Picked Up') {
      data.pickupStatus = 'Completed';
      data.pickupAt = new Date();
    }
    if (stage === 'Returned') {
      data.returnStatus = 'Completed';
      data.returnedAt = new Date();
      data.status = 'Completed';
    }
    if (stage === 'Inspection Completed') {
      data.status = 'Completed';
    }

    const updated = await prisma.rental.update({
      where: { id: rentalId },
      data,
      include: rentalInclude,
    });

    await logActivity('tracker', `Rental #${rentalId} advanced to ${stage}`, { rentalId, stage });
    res.json(serializeRental(updated));
  } catch (error) {
    console.error('Advance tracker error:', error);
    res.status(500).json({ message: 'Failed to advance tracker' });
  }
};

const setSchedule = async (req, res) => {
  try {
    const rentalId = Number(req.params.rentalId);
    const { scheduledPickup, scheduledReturn } = req.body || {};

    const rental = await prisma.rental.findUnique({ where: { id: rentalId } });
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const data = {};
    if (scheduledPickup != null) data.scheduledPickup = new Date(scheduledPickup);
    if (scheduledReturn != null) data.scheduledReturn = new Date(scheduledReturn);
    if (scheduledPickup != null) data.pickupStatus = 'Scheduled';
    if (scheduledReturn != null) data.returnStatus = 'Scheduled';

    const updated = await prisma.rental.update({
      where: { id: rentalId },
      data,
      include: rentalInclude,
    });

    await logActivity('schedule', `Schedule updated for rental #${rentalId}`, { rentalId });
    res.json(serializeRental(updated));
  } catch (error) {
    console.error('Set schedule error:', error);
    res.status(500).json({ message: 'Failed to update schedule' });
  }
};

module.exports = {
  listSchedule,
  generateOtps,
  verifyPickupOtp,
  verifyReturnOtp,
  advanceTracker,
  setSchedule,
  TRACKER_STAGES,
};
