const express = require('express');
const {protect,authorize} = require('../middlewares/auth');
const {
    getTransaction,
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transactionController');

const router = express.Router();

router.route('/')
    .get(protect, getTransactions)
    .post(protect, authorize('admin','manager'), createTransaction);

router.route('/:id')
    .get(protect, getTransaction)
    .put(protect, authorize('admin','manager'), updateTransaction)
    .delete(protect, authorize('admin'), deleteTransaction);

module.exports = router;