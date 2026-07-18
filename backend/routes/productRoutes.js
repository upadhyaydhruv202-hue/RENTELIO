const express = require('express');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  restoreProduct,
} = require('../controllers/productController');
const { requireStaff, requireAdmin } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');

const router = express.Router();

const handleUpload = (req, res, next) => {
  uploadProductImage(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image must be 5 MB or smaller' });
      }
      return res.status(400).json({ message: err.message || 'Image upload failed' });
    }
    next();
  });
};

router.use(requireStaff);
router.get('/', getProducts);
router.post('/', requireAdmin, handleUpload, createProduct);
router.put('/:id', requireAdmin, handleUpload, updateProduct);
router.put('/:id/archive', requireAdmin, archiveProduct);
router.put('/:id/restore', requireAdmin, restoreProduct);
router.delete('/:id', requireAdmin, deleteProduct);

module.exports = router;
