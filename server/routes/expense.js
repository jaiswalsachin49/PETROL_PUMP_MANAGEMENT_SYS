const express = require('express');
const router = express.Router();
const {
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getMonthlyExpenseSummary,
    getExpenseComparison
} = require('../controllers/expenseController');

const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

// GET /api/expenses - Get all expenses
router.get('/', getExpenses);

// GET /api/expenses/summary/monthly - Monthly summary
router.get('/summary/monthly', authorize('admin', 'manager', 'accountant'), getMonthlyExpenseSummary);

// GET /api/expenses/comparison - Month-over-month comparison
router.get('/comparison', authorize('admin', 'manager', 'accountant'), getExpenseComparison);

// GET /api/expenses/category/:category - By category
router.get('/category/:category', getExpensesByCategory);

// POST /api/expenses - Create expense
router.post('/', authorize('admin', 'manager'), createExpense);

// GET /api/expenses/:id - Get single expense
router.get('/:id', getExpense);

// PUT /api/expenses/:id - Update expense
router.put('/:id', authorize('admin', 'manager'), updateExpense);

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', authorize('admin'), deleteExpense);

module.exports = router;
