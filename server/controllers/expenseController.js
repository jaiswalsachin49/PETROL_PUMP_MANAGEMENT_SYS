const Transaction = require('../models/Transaction');

// @desc Get all expenses
// @route GET /api/expenses
// @access Private
const getExpenses = async (req, res) => {
    try {
        const { startDate, endDate, category } = req.query;

        let query = { type: 'expense' };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Filter by category (from description)
        if (category) {
            query.description = { $regex: category, $options: 'i' };
        }

        const expenses = await Transaction.find(query)
            .populate('createdBy', 'username email')
            .sort({ date: -1 });

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        res.json({
            success: true,
            count: expenses.length,
            totalAmount: totalExpenses,
            data: expenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get single expense
// @route GET /api/expenses/:id
// @access Private
const getExpense = async (req, res) => {
    try {
        const expense = await Transaction.findOne({
            _id: req.params.id,
            type: 'expense'
        }).populate('createdBy', 'username email');

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        res.json({
            success: true,
            data: expense
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Create new expense
// @route POST /api/expenses
// @access Private (Manager/Admin)
const createExpense = async (req, res) => {
    try {
        const expenseData = {
            ...req.body,
            type: 'expense',
            createdBy: req.user._id 
        };

        const expense = await Transaction.create(expenseData);

        res.status(201).json({
            success: true,
            data: expense,
            message: 'Expense recorded successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Update expense
// @route PUT /api/expenses/:id
// @access Private (Manager/Admin)
const updateExpense = async (req, res) => {
    try {
        let expense = await Transaction.findOne({
            _id: req.params.id,
            type: 'expense'
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        expense = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: expense,
            message: 'Expense updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Delete expense
// @route DELETE /api/expenses/:id
// @access Private (Admin only)
const deleteExpense = async (req, res) => {
    try {
        const expense = await Transaction.findOne({
            _id: req.params.id,
            type: 'expense'
        });

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found'
            });
        }

        await expense.deleteOne();

        res.json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get expenses by category
// @route GET /api/expenses/category/:category
// @access Private
const getExpensesByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const { startDate, endDate } = req.query;

        let query = {
            type: 'expense',
            description: { $regex: category, $options: 'i' }
        };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const expenses = await Transaction.find(query).sort({ date: -1 });

        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        res.json({
            success: true,
            category,
            count: expenses.length,
            totalAmount,
            data: expenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get monthly expense summary
// @route GET /api/expenses/summary/monthly
// @access Private
const getMonthlyExpenseSummary = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const expenses = await Transaction.find({
            type: 'expense',
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: -1 });


        const categoryMap = {};
        expenses.forEach(exp => {
            let category = 'Other';
            const desc = exp.description.toLowerCase();

            if (desc.includes('salary') || desc.includes('wage')) category = 'Salary';
            else if (desc.includes('electricity') || desc.includes('power')) category = 'Utilities';
            else if (desc.includes('maintenance') || desc.includes('repair')) category = 'Maintenance';
            else if (desc.includes('fuel')) category = 'Fuel';
            else if (desc.includes('rent')) category = 'Rent';
            else if (desc.includes('tax')) category = 'Tax';

            if (!categoryMap[category]) {
                categoryMap[category] = { category, total: 0, count: 0, expenses: [] };
            }

            categoryMap[category].total += exp.amount;
            categoryMap[category].count += 1;
            categoryMap[category].expenses.push({
                _id: exp._id,
                description: exp.description,
                amount: exp.amount,
                date: exp.date,
                paymentMethod: exp.paymentMethod
            });
        });

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const categorySummary = Object.values(categoryMap);

        res.json({
            success: true,
            data: {
                month: parseInt(month),
                year: parseInt(year),
                totalExpenses,
                totalTransactions: expenses.length,
                byCategory: categorySummary,
                averageDaily: (totalExpenses / new Date(year, month, 0).getDate()).toFixed(2)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get expense comparison (month-over-month)
// @route GET /api/expenses/comparison
// @access Private
const getExpenseComparison = async (req, res) => {
    try {
        const { months = 3 } = req.query; 

        const monthlyData = [];
        const now = new Date();

        for (let i = 0; i < parseInt(months); i++) {
            const month = now.getMonth() - i;
            const year = now.getFullYear();
            const date = new Date(year, month, 1);

            const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const expenses = await Transaction.find({
                type: 'expense',
                date: { $gte: startDate, $lte: endDate }
            });

            const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

            monthlyData.push({
                month: date.getMonth() + 1,
                year: date.getFullYear(),
                monthName: date.toLocaleString('default', { month: 'long' }),
                totalExpenses: total,
                transactionCount: expenses.length
            });
        }
        const trend = monthlyData.length > 1
            ? ((monthlyData[0].totalExpenses - monthlyData[1].totalExpenses) / monthlyData[1].totalExpenses * 100).toFixed(2)
            : 0;

        res.json({
            success: true,
            data: {
                monthlyExpenses: monthlyData.reverse(),
                trend: `${trend > 0 ? '+' : ''}${trend}%`,
                trendDirection: trend > 0 ? 'increase' : trend < 0 ? 'decrease' : 'stable'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    getMonthlyExpenseSummary,
    getExpenseComparison
};