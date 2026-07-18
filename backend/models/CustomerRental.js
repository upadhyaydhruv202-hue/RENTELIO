const Customer = require('./Customer');
const Product = require('./Product');
const Rental = require('./Rental');
const Deposit = require('./Deposit');
const { daysBetween } = require('../utils/serializers');
const { calcSecurityDeposit } = require('../utils/pricing');

/**
 * Customer bookings write into the SHARED rentals + deposits tables
 * so admin and shop always see the same lifecycle state.
 */
const CustomerRental = {
  findByCustomer: (customerId) => Rental.findByCustomer(customerId),
  findById: (id, customerId) => Rental.findByIdForCustomer(id, customerId),
  getStats: (customerId) => Rental.getCustomerStats(customerId),
  syncStatuses: (customerId) => Rental.syncLifecycleStatuses(customerId),

  async bookRental({
    customerId,
    productId,
    startDate,
    returnDate,
    fulfillment = 'pickup',
    shippingAddress = '',
  }) {
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw Object.assign(new Error('Customer not found'), { status: 404 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw Object.assign(new Error('Product not found'), { status: 404 });
    }
    if (product.status !== 'Available' || Number(product.quantity) < 1) {
      throw Object.assign(new Error('Product is not available for rent'), { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(returnDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      throw Object.assign(new Error('Invalid rental dates'), { status: 400 });
    }

    const days = daysBetween(startDate, returnDate);
    const amount = Number(product.pricePerDay) * days;
    const depositAmount = calcSecurityDeposit(product.pricePerDay);

    const rental = await Rental.create({
      customerName: customer.name,
      customerId: customer.id,
      productId,
      startDate,
      returnDate,
      amount,
      status: 'Requested',
      fulfillment: fulfillment === 'delivery' ? 'delivery' : 'pickup',
      shippingAddress:
        fulfillment === 'delivery'
          ? shippingAddress || customer.address || ''
          : '',
    });

    await Deposit.create({
      rentalId: rental.id,
      amount: depositAmount,
      status: 'Held',
    });

    const newQty = Math.max(0, Number(product.quantity) - 1);
    await Product.update(productId, {
      quantity: newQty,
      status: newQty <= 0 ? 'Rented' : 'Available',
    });

    await Rental.syncLifecycleStatuses();

    const full = await Rental.findById(rental.id);
    return { rental: full, product, days, amount, depositAmount };
  },

  async cancelAndRestore(id, customerId) {
    const rental = await Rental.findByIdForCustomer(id, customerId);
    if (!rental) {
      throw Object.assign(new Error('Rental not found'), { status: 404 });
    }
    if (!['Requested', 'Approved'].includes(rental.status)) {
      throw Object.assign(new Error('Only pending requests can be cancelled'), { status: 400 });
    }

    await Rental.update(id, { status: 'Cancelled' });
    await Deposit.updateStatusByRentalId(id, 'Refunded', {
      refundedAmount: rental.depositAmount || 0,
      lateFeeDeducted: 0,
    });

    const product = await Product.findById(rental.productId);
    if (product) {
      await Product.update(product.id, {
        quantity: Number(product.quantity) + 1,
        status: 'Available',
      });
    }

    return Rental.findByIdForCustomer(id, customerId);
  },
};

module.exports = CustomerRental;
