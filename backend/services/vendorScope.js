const prisma = require('../config/prisma');

const productScope = (vendorId) => ({ vendorId: Number(vendorId) });

const rentalScope = (vendorId) => ({ product: { vendorId: Number(vendorId) } });

const assertOwnProduct = async (vendorId, productId) => {
  const product = await prisma.product.findFirst({
    where: { id: Number(productId), vendorId: Number(vendorId) },
  });
  return product;
};

const assertOwnRental = async (vendorId, rentalId) => {
  const rental = await prisma.rental.findFirst({
    where: { id: Number(rentalId), product: { vendorId: Number(vendorId) } },
    include: {
      product: true,
      deposit: { include: { events: { orderBy: { id: 'desc' } } } },
      customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
    },
  });
  return rental;
};

module.exports = { productScope, rentalScope, assertOwnProduct, assertOwnRental };
