const prisma = require('../config/prisma');
const { serializeProduct } = require('../utils/serializers');

const getCart = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const items = await prisma.cartItem.findMany({
      where: { customerId },
      include: { product: true },
      orderBy: { id: 'desc' },
    });

    res.json(
      items.map((item) => ({
        id: item.id,
        productId: item.productId,
        startDate: item.startDate,
        returnDate: item.returnDate,
        product: serializeProduct(item.product),
      }))
    );
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ message: 'Failed to load cart' });
  }
};

const addToCart = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const { productId, startDate, returnDate } = req.body || {};

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (!product || product.archived) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const item = await prisma.cartItem.upsert({
      where: {
        customerId_productId: { customerId, productId: Number(productId) },
      },
      create: {
        customerId,
        productId: Number(productId),
        startDate: startDate ? new Date(startDate) : null,
        returnDate: returnDate ? new Date(returnDate) : null,
      },
      update: {
        startDate: startDate ? new Date(startDate) : undefined,
        returnDate: returnDate ? new Date(returnDate) : undefined,
      },
      include: { product: true },
    });

    res.status(201).json({
      id: item.id,
      productId: item.productId,
      startDate: item.startDate,
      returnDate: item.returnDate,
      product: serializeProduct(item.product),
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ message: 'Failed to add to cart' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const productId = Number(req.params.productId);

    const existing = await prisma.cartItem.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await prisma.cartItem.delete({
      where: { customerId_productId: { customerId, productId } },
    });
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ message: 'Failed to remove from cart' });
  }
};

const clearCart = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const result = await prisma.cartItem.deleteMany({ where: { customerId } });
    res.json({ message: 'Cart cleared', removed: result.count });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart };
