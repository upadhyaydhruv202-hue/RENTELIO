const Product = require('../models/Product');

const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, category, quantity, pricePerDay, status, description, imageUrl, securityDeposit } = req.body;

    if (!name || !category || quantity == null || pricePerDay == null) {
      return res.status(400).json({ message: 'Missing required product fields' });
    }

    const product = await Product.create({
      name,
      category,
      quantity: Number(quantity),
      pricePerDay: Number(pricePerDay),
      status: status || 'Available',
      description: description || '',
      imageUrl: imageUrl || '',
      securityDeposit: securityDeposit != null ? Number(securityDeposit) : Number(pricePerDay) * 2,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, quantity, pricePerDay, status, description, imageUrl, securityDeposit } = req.body;

    const existing = await Product.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = await Product.update(id, {
      name: name ?? existing.name,
      category: category ?? existing.category,
      quantity: quantity != null ? Number(quantity) : existing.quantity,
      pricePerDay: pricePerDay != null ? Number(pricePerDay) : existing.pricePerDay,
      status: status ?? existing.status,
      description: description != null ? description : existing.description,
      imageUrl: imageUrl != null ? imageUrl : existing.imageUrl,
      securityDeposit:
        securityDeposit != null ? Number(securityDeposit) : existing.securityDeposit,
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.delete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted', product });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
