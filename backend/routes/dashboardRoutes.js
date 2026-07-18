const express = require('express');
const { getDashboard, getReports } = require('../controllers/dashboardController');
const { requireStaff, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireStaff);
router.get('/', getDashboard);
router.get('/reports', requireAdmin, getReports);

module.exports = router;
