const prisma = require('../config/prisma');
const { serializeProduct } = require('../utils/serializers');

const getWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const items = await prisma.wishlistItem.findMany({
      where: { customerId },
      include: { product: true },
      orderBy: { id: 'desc' },
    });

    res.json(
      items.map((item) => ({
        id: item.id,
        productId: item.productId,
        product: serializeProduct(item.product),
      }))
    );
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Failed to load wishlist' });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const productId = Number(req.body?.productId || req.params.productId);

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const item = await prisma.wishlistItem.upsert({
      where: { customerId_productId: { customerId, productId } },
      create: { customerId, productId },
      update: {},
      include: { product: true },
    });

    res.status(201).json({
      id: item.id,
      productId: item.productId,
      product: serializeProduct(item.product),
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Failed to add to wishlist' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const customerId = req.customer.id;
    const productId = Number(req.params.productId);

    const existing = await prisma.wishlistItem.findUnique({
      where: { customerId_productId: { customerId, productId } },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    await prisma.wishlistItem.delete({
      where: { customerId_productId: { customerId, productId } },
    });
    res.json({ message: 'Item removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Failed to remove from wishlist' });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
