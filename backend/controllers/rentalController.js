const Rental = require('../models/Rental');
const Product = require('../models/Product');
const Deposit = require('../models/Deposit');

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
    const { customerName, productId, startDate, returnDate, depositAmount } = req.body;

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

    const start = new Date(startDate);
    const end = new Date(returnDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const amount = Number(product.pricePerDay) * days;

    const rental = await Rental.create({
      customerName,
      customerId: null,
      productId,
      startDate,
      returnDate,
      amount,
      status: 'Active',
    });

    const newQty = Math.max(0, Number(product.quantity) - 1);
    await Product.update(productId, {
      quantity: newQty,
      status: newQty <= 0 ? 'Rented' : 'Available',
    });

    const deposit = await Deposit.create({
      rentalId: rental.id,
      amount:
        depositAmount != null
          ? Number(depositAmount)
          : Number(product.securityDeposit) || Number(product.pricePerDay) * 2,
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
    const { status, markReturned } = req.body;

    const rental = await Rental.findById(id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    let lateCharge = 0;
    let updatedStatus = status || rental.status;

    if (markReturned) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expected = new Date(rental.returnDate);
      expected.setHours(0, 0, 0, 0);

      if (today > expected) {
        const lateDays = Math.ceil((today - expected) / (1000 * 60 * 60 * 24));
        lateCharge = lateDays * Number(rental.pricePerDay);
      }

      updatedStatus = 'Completed';

      const product = await Product.findById(rental.productId);
      if (product) {
        await Product.update(product.id, {
          quantity: Number(product.quantity) + 1,
          status: 'Available',
        });
      }

      // Refund deposit on successful return
      await Deposit.updateStatusByRentalId(id, 'Refunded');
    }

    await Rental.update(id, { status: updatedStatus });
    const full = await Rental.findById(id);

    res.json({ rental: full, lateCharge });
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

    const deposit = await Deposit.updateStatus(id, status);
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit not found' });
    }

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
