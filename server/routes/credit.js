const express = require('express');
const router = express.Router();
const {
    getCreditCustomers,
    getOverdueCustomers,
    getCustomerStatement,
    getAgingReport,
    sendPaymentReminder
} = require('../controllers/creditController');

const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// GET /api/credit/customers - All credit customers
router.get('/customers', getCreditCustomers);

// GET /api/credit/overdue - Overdue customers
router.get('/overdue', authorize('admin', 'manager', 'accountant'), getOverdueCustomers);

// GET /api/credit/statement/:customerId - Customer statement
router.get('/statement/:customerId', getCustomerStatement);

// GET /api/credit/aging - Aging report
router.get('/aging', authorize('admin', 'manager', 'accountant'), getAgingReport);

// POST /api/credit/reminder/:customerId - Send payment reminder
router.post('/reminder/:customerId', authorize('admin', 'manager'), sendPaymentReminder);

module.exports = router;
