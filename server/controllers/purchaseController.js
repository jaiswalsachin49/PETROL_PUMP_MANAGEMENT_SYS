const Purchase = require('../models/Purchase');

// @desc    Get all purchase
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find();
        res.status(200).json({
            success: true,
            count: purchases.length,
            data: purchases
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Get single purchase
// @route   GET /api/purchases/:id
// @access  Private
const getPurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            })
        }
        res.status(200).json({
            success: true,
            data: purchase
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Create new purchase
// @route   POST /api/purchases
// @access  Private
const createPurchase = async (req, res) => {
    try {
        const purchase = new Purchase(req.body);
        await purchase.save();
        res.status(201).json({
            success: true,
            data: purchase
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Update purchase
// @route   PUT /api/purchases/:id
// @access  Private
const updatePurchase = async (req, res) => {
    try {
        let purchase = await Purchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            })
        }
        for (const key in req.body) {
            purchase[key] = req.body[key];
        }
        let total = 0;
        purchase.items.forEach(item => {
            item.totalPrice = item.quantity * item.unitPrice;
            total += item.totalPrice;
        });
        purchase.totalAmount = total;

        await purchase.save();
        res.status(200).json({
            success: true,
            data: purchase
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Delete purchase
// @route   DELETE /api/purchases/:id
// @access  Private
const deletePurchase = async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id);
        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: 'Purchase not found'
            })
        }
        await purchase.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Purchase removed'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Get recent fuel deliveries
// @route   GET /api/purchases/recent?limit=5
// @access  Private
const getRecentDeliveries = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const deliveries = await Purchase.find()
            .sort({ date: -1 })
            .limit(limit)
            .populate('supplierId', 'name')
            .lean();

        const formatted = deliveries.map(d => ({
            id: d._id,
            supplier: d.supplierId?.name || 'Unknown',
            fuel: d.items[0]?.itemName || 'Fuel',
            quantity: d.items.reduce((sum, item) => sum + item.quantity, 0),
            date: new Date(d.date).toLocaleDateString('en-IN'),
            status: d.paymentStatus === 'paid' ? 'Completed' : 'Pending'
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    getPurchases,
    getPurchase,
    createPurchase,
    updatePurchase,
    deletePurchase,
    getRecentDeliveries
}