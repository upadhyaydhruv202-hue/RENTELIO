const express = require('express');
const {
  getRentals,
  createRental,
  updateRental,
  getPendingReturns,
  getDeposits,
  updateDeposit,
} = require('../controllers/rentalController');

const router = express.Router();

router.get('/returns/pending', getPendingReturns);
router.get('/deposits/all', getDeposits);
router.put('/deposits/:id', updateDeposit);
router.get('/', getRentals);
router.post('/', createRental);
router.put('/:id', updateRental);

module.exports = router;
