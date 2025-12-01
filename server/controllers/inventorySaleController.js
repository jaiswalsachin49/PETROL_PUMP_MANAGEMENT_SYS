const InventorySale = require('../models/InventorySale');
const Inventory = require('../models/Inventory');
const Transaction = require('../models/Transaction');

// @desc    Create new inventory sale
// @route   POST /api/inventory-sales
// @access  Private
const createInventorySale = async (req, res) => {
    try {
        const { itemId, quantity, paymentMethod, soldBy, notes } = req.body;

        // 1. Check Inventory Stock
        const item = await Inventory.findById(itemId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        if (item.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${item.quantity}, Requested: ${quantity}`
            });
        }

        // 2. Calculate Totals
        const totalAmount = quantity * item.sellingPrice;

        // 3. Create Sale Record
        const sale = await InventorySale.create({
            itemId,
            itemName: item.itemName,
            quantity,
            sellingPrice: item.sellingPrice,
            totalAmount,
            paymentMethod,
            soldBy,
            notes
        });

        // 4. Deduct Inventory
        item.quantity -= quantity;
        await item.save();

        // 5. Create Financial Transaction
        await Transaction.create({
            type: 'sale',
            amount: totalAmount,
            paymentMethod: paymentMethod || 'cash',
            description: `Inventory Sale: ${item.itemName} x ${quantity}`,
            referenceId: sale.saleId,
            createdBy: req.user ? req.user._id : null // Assuming auth middleware adds user
        });

        res.status(201).json({
            success: true,
            data: sale,
            message: 'Sale recorded and inventory updated'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all inventory sales
// @route   GET /api/inventory-sales
// @access  Private
const getInventorySales = async (req, res) => {
    try {
        const sales = await InventorySale.find()
            .populate('itemId', 'itemName category')
            .populate('soldBy', 'name')
            .sort({ date: -1 });

        res.json({
            success: true,
            count: sales.length,
            data: sales
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createInventorySale,
    getInventorySales
};
