const express = require('express');
const { requireCustomer } = require('../middleware/customerAuth');
const {
  register,
  login,
  getProfile,
  updateProfile,
  getProducts,
  getProduct,
  getDashboard,
  createRental,
  getRentals,
  getRental,
  cancelRental,
} = require('../controllers/customerController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/products', getProducts);
router.get('/products/:id', getProduct);

router.get('/dashboard', requireCustomer, getDashboard);
router.get('/profile', requireCustomer, getProfile);
router.put('/profile', requireCustomer, updateProfile);

router.post('/rentals', requireCustomer, createRental);
router.get('/rentals', requireCustomer, getRentals);
router.get('/rentals/:id', requireCustomer, getRental);
router.put('/rentals/:id/cancel', requireCustomer, cancelRental);

module.exports = router;
