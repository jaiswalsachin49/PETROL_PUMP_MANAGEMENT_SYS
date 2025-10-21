const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const {
    getSales,
    getSale,
    getSalesByCustomer,
    getSalesByDateRange,
    createSale,
    updateSale,
    deleteSale
} = require('../controllers/saleController');

const router = express.Router();

router.route('/customer/:customerId')
    .get(protect, getSalesByCustomer);

router.route('/date-range')
    .get(protect, getSalesByDateRange);

router.route('/')
    .get(protect, getSales)
    .post(protect, authorize('admin', 'manager', 'cashier'), createSale);

router.route('/:id')
    .get(protect, getSale)
    .put(protect, authorize('admin', 'manager'), updateSale)
    .delete(protect, authorize('admin'), deleteSale);

module.exports = router;