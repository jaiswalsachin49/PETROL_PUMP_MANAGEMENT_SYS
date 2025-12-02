const Sale = require('../models/Sale')
const Pump = require('../models/Pump')
const Tank = require('../models/Tank')
const Customer = require('../models/Customer')

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res) => {
    try {
        const filter = req.user.organizationId ? { organizationId: req.user.organizationId } : {};
        const sales = await Sale.find(filter)
            .populate('customerId', 'name')
            .populate('pumpId', 'pumpNumber')
            .populate('employeeId', 'name')
        res.json({
            success: true,
            count: sales.length,
            data: sales
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Get single sale
// @route   GET /api/sales/:id
// @access  Private
const getSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            })
        }
        res.json({
            success: true,
            data: sale
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Get sales by customer
// @route   GET /api/sales/customer/:customerId
// @access  Private
const getSalesByCustomer = async (req, res) => {
    try {
        const sales = await Sale.find({ customerId: req.params.customerId })
            .populate('customerId', 'name')
            .populate('pumpId', 'pumpNumber')
            .populate('employeeId', 'name')
        res.json({
            success: true,
            count: sales.length,
            data: sales
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Get sales by date range
// @route   GET /api/sales/date?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private
const getSalesByDateRange = async (req, res) => {
    try {
        const { start, end } = req.query;
        const sales = await Sale.find({
            date: {
                $gte: new Date(start),
                $lte: new Date(end)
            }
        })
            .populate('customerId', 'name')
            .populate('pumpId', 'pumpNumber')
            .populate('employeeId', 'name')
        res.json({
            success: true,
            count: sales.length,
            data: sales
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Create new sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res) => {
    try {
        req.body.totalAmount = req.body.quantity * req.body.pricePerLiter;

        // Verify Shift is Active
        const shift = await require('../models/Shift').findById(req.body.shiftId);
        if (!shift || shift.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Sales can only be added to an ACTIVE shift.'
            });
        }

        const sale = await Sale.create({
            ...req.body,
            organizationId: req.user.organizationId
        });

        const pump = await Pump.findById(sale.pumpId);
        if (pump && pump.tankId) {
            await Tank.findByIdAndUpdate(
                pump.tankId,
                { $inc: { currentLevel: -sale.quantity } }
            );
        }

        if ((sale.saleType === 'credit' || sale.saleType === 'fleet') && sale.customerId) {
            const customer = await Customer.findById(sale.customerId);

            if (customer) {
                const newBalance = customer.outstandingBalance + sale.totalAmount;
                if (newBalance > customer.creditLimit) {
                    await Sale.findByIdAndDelete(sale._id);
                    if (pump && pump.tankId) {
                        await Tank.findByIdAndUpdate(pump.tankId, {
                            $inc: { currentLevel: sale.quantity }
                        });
                    }
                    return res.status(400).json({
                        success: false,
                        message: `Credit limit exceeded. Limit: ${customer.creditLimit}, Current: ${customer.outstandingBalance}, Attempted: ${sale.totalAmount}`
                    });
                }

                await Customer.findByIdAndUpdate(sale.customerId, {
                    $inc: { outstandingBalance: sale.totalAmount }
                });
            }
        }

        res.status(201).json({
            success: true,
            data: sale
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Update sale
// @route   PUT /api/sales/:id
// @access  Private
const updateSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }
        if (req.body.quantity !== undefined) sale.quantity = req.body.quantity;
        if (req.body.pricePerLiter !== undefined) sale.pricePerLiter = req.body.pricePerLiter;
        sale.totalAmount = sale.quantity * sale.pricePerLiter;
        for (const key in req.body) {
            if (!['quantity', 'pricePerLiter', 'totalAmount'].includes(key)) {
                sale[key] = req.body[key];
            }
        }
        await sale.save();
        res.json({
            success: true,
            data: sale
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Delete sale
// @route   DELETE /api/sales/:id
// @access  Private
const deleteSale = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            })
        }
        await sale.deleteOne();
        res.json({
            success: true,
            message: 'Sale removed successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

module.exports = {
    getSales,
    getSale,
    getSalesByCustomer,
    getSalesByDateRange,
    createSale,
    updateSale,
    deleteSale
}