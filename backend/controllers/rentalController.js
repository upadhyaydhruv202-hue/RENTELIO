const Rental = require('../models/Rental');
const Product = require('../models/Product');
const Deposit = require('../models/Deposit');
const { daysBetween } = require('../utils/serializers');
const { calcSecurityDeposit } = require('../utils/pricing');
const { calculateLateFee } = require('../services/rentalLifecycle');
const prisma = require('../config/prisma');

const getRentals = async (req, res) => {
  try {
    await Rental.syncLifecycleStatuses();
    const rentals = await Rental.findAll();
    res.json(rentals);
  } catch (error) {
    console.error('Get rentals error:', error);
    res.status(500).json({ message: 'Failed to fetch rentals' });
  }
};

const createRental = async (req, res) => {
  try {
    const { customerName, productId, startDate, returnDate } = req.body;

    if (!customerName || !productId || !startDate || !returnDate) {
      return res.status(400).json({ message: 'Missing required rental fields' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.status === 'Rented' || product.quantity < 1) {
      return res.status(400).json({ message: 'Product is not available for rent' });
    }

    const days = daysBetween(startDate, returnDate);
    const amount = Number(product.pricePerDay) * days;
    // Always pricePerDay × 1.5 — ignore any client-sent deposit
    const depositHeld = calcSecurityDeposit(product.pricePerDay);

    const rental = await Rental.create({
      customerName,
      customerId: null,
      productId,
      startDate,
      returnDate,
      amount,
      status: 'Active',
      fulfillment: 'pickup',
    });

    const newQty = Math.max(0, Number(product.quantity) - 1);
    await Product.update(productId, {
      quantity: newQty,
      status: newQty <= 0 ? 'Rented' : 'Available',
    });

    const deposit = await Deposit.create({
      rentalId: rental.id,
      amount: depositHeld,
      status: 'Held',
    });

    const full = await Rental.findById(rental.id);
    res.status(201).json({ rental: full, deposit });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({ message: 'Failed to create rental' });
  }
};

const updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, markReturned, approve } = req.body;

    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    let lateCharge = 0;
    let refundedAmount = 0;
    let updatedStatus = status || rental.status;

    if (approve && rental.status === 'Requested') {
      updatedStatus = 'Approved';
      await Rental.update(id, { status: updatedStatus });
      const full = await Rental.findById(id);
      return res.json({ rental: full, lateCharge: 0, refundedAmount: 0 });
    }

    if (markReturned) {
      const raw = await prisma.rental.findUnique({
        where: { id: Number(id) },
        include: { deposit: true, product: true },
      });

      const { lateFee } = await calculateLateFee(raw, rental.pricePerDay);
      lateCharge = lateFee;

      const depositHeld = Number(raw.deposit?.amount || 0);
      const deducted = Math.min(lateCharge, depositHeld);
      refundedAmount = Math.max(0, depositHeld - deducted);

      updatedStatus = 'Completed';

      await Rental.update(id, { status: updatedStatus, lateFee: lateCharge });

      if (raw.product) {
        await Product.update(raw.product.id, {
          quantity: Number(raw.product.quantity) + 1,
          status: 'Available',
        });
      }

      await Deposit.updateStatusByRentalId(id, 'Refunded', {
        refundedAmount,
        lateFeeDeducted: deducted,
      });

      const full = await Rental.findById(id);
      return res.json({
        rental: full,
        lateCharge,
        refundedAmount,
        message:
          lateCharge > 0
            ? `Late fee ₹${lateCharge} deducted. ₹${refundedAmount} refunded.`
            : `Full deposit ₹${refundedAmount} refunded.`,
      });
    }

    await Rental.update(id, { status: updatedStatus });
    const full = await Rental.findById(id);
    res.json({ rental: full, lateCharge, refundedAmount });
  } catch (error) {
    console.error('Update rental error:', error);
    res.status(500).json({ message: 'Failed to update rental' });
  }
};

const getPendingReturns = async (req, res) => {
  try {
    await Rental.syncLifecycleStatuses();
    const returns = await Rental.getPendingReturns();
    res.json(returns);
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ message: 'Failed to fetch pending returns' });
  }
};

const getDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.findAll();
    res.json(deposits);
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({ message: 'Failed to fetch deposits' });
  }
};

const updateDeposit = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const existing = await prisma.deposit.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Deposit not found' });
    }

    const extra =
      status === 'Refunded'
        ? { refundedAmount: Number(existing.amount), lateFeeDeducted: 0 }
        : status === 'Forfeited'
          ? { refundedAmount: 0, lateFeeDeducted: Number(existing.amount) }
          : {};

    const deposit = await Deposit.updateStatus(id, status, extra);
    res.json(deposit);
  } catch (error) {
    console.error('Update deposit error:', error);
    res.status(500).json({ message: 'Failed to update deposit' });
  }
};

module.exports = {
  getRentals,
  createRental,
  updateRental,
  getPendingReturns,
  getDeposits,
  updateDeposit,
};
