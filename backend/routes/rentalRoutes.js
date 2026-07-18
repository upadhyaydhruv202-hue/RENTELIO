const express = require('express');
const {
  getRentals,
  createRental,
  updateRental,
  getPendingReturns,
  getDeposits,
  updateDeposit,
} = require('../controllers/rentalController');
const { requireStaff, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireStaff);
router.get('/returns/pending', getPendingReturns);
router.get('/deposits/all', requireAdmin, getDeposits);
router.put('/deposits/:id', requireAdmin, updateDeposit);
router.get('/', getRentals);
router.post('/', createRental);
router.put('/:id', updateRental);

module.exports = router;
