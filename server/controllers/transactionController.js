const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer')
const Supplier = require('../models/Supplier')

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        const filter = req.user.organizationId ? { organizationId: req.user.organizationId } : {};
        const transactions = await Transaction.find(filter)
            .populate('customerId', 'name')
            .populate('supplierId', 'name')
            .populate('createdBy', 'username');
        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            })
        }
        res.status(200).json({
            success: true,
            data: transaction
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.create({
            ...req.body,
            organizationId: req.user.organizationId
        });

        if (transaction.type === 'payment_received' && transaction.customerId) {
            await Customer.findByIdAndUpdate(
                transaction.customerId,
                { $inc: { outstandingBalance: -transaction.amount } }
            );
        }

        // ✅ ADD THIS: Update supplier balance for payments made
        if (transaction.type === 'payment_made' && transaction.supplierId) {
            // You may want to track supplier balances too
            await Supplier.findByIdAndUpdate(transaction.supplierId, {
                $inc: { outstandingPayable: -transaction.amount }
            });
        }
        res.status(201).json({
            success: true,
            data: transaction
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc Update transaction
// @route PUT /api/transactions/:id
// @access Private
const updateTransaction = async (req, res) => {
    try {
        let transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            })
        }
        transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            success: true,
            data: transaction
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            })
        }
        await transaction.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Transaction deleted successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports = {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction
}