const Shift = require('../models/Shift')
const Tank = require('../models/Tank')
const Sale = require('../models/Sale')


// @desc    Get all shifts
// route    GET /api/shifts
// access   Private
const getShifts = async (req, res) => {
    try {
        const shifts = await Shift.find().populate('assignedEmployees').populate('supervisorId')
        res.json({
            success: true,
            count: shifts.length,
            data: shifts
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Get single shift
// route    GET /api/shifts/:id
// access   Private
const getShift = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id).populate('assignedEmployees').populate('supervisorId')
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            })
        }
        res.json({
            success: true,
            data: shift
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// @desc    Create Shift
// route    POST /api/shifts
// access   Private
const createShift = async (req, res) => {
    try {
        // 1. Check if there is already an active shift
        const activeShift = await Shift.findOne({ status: 'active' });
        if (activeShift) {
            return res.status(400).json({
                success: false,
                message: 'There is already an active shift. Please close it first.'
            });
        }

        // 2. Check if 2 shifts already exist for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const shiftsToday = await Shift.countDocuments({
            date: { $gte: today, $lt: tomorrow }
        });

        if (shiftsToday >= 2) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 2 shifts allowed per day.'
            });
        }

        const shift = new Shift(req.body);
        await shift.save();
        res.status(201).json({
            success: true,
            data: shift
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Update Shift
// route    PUT /api/shifts/:id
// access   Private
const updateShift = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id)
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            })
        }
        for (const key in req.body) {
            shift[key] = req.body[key]
        }
        await shift.save()
        res.json({
            success: true,
            data: shift
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Delete Shift
// route    DELETE /api/shifts/:id
// access   Private
const deleteShift = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.id)
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            })
        }
        await shift.deleteOne()
        res.json({
            success: true,
            message: 'Shift deleted successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc Close a shift and calculate final totals from Sale collection
// @route POST /api/shifts/:id/close
// @access Private
const closeShift = async (req, res) => {
    try {
        const shiftId = req.params.id;

        // 1. Find the shift
        const shift = await Shift.findById(shiftId);
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        // 2. Check if already closed
        if (shift.status === 'closed' || shift.status === 'reconciled') {
            return res.status(400).json({
                success: false,
                message: 'Shift is already closed'
            });
        }

        // 3. Aggregate ALL sales data from Sale collection (SINGLE SOURCE OF TRUTH)
        const salesAggregation = await Sale.aggregate([
            { $match: { shiftId: shift._id } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalAmount' },
                    totalQuantity: { $sum: '$quantity' },
                    totalTransactions: { $sum: 1 },

                    // Calculate payment method breakdowns
                    cashCollected: {
                        $sum: {
                            $cond: [
                                { $eq: ['$saleType', 'cash'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    },
                    cardPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ['$saleType', 'card'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    },
                    upiPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ['$saleType', 'upi'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    },
                    creditSales: {
                        $sum: {
                            $cond: [
                                { $in: ['$saleType', ['credit', 'fleet']] },
                                '$totalAmount',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // 4. Get aggregated data or default to zeros
        const salesData = salesAggregation[0] || {
            totalSales: 0,
            totalQuantity: 0,
            totalTransactions: 0,
            cashCollected: 0,
            cardPayments: 0,
            upiPayments: 0,
            creditSales: 0
        };

        // 5. Update shift with calculated totals
        shift.totalSales = salesData.totalSales;
        shift.cashCollected = salesData.cashCollected;
        shift.cardPayments = salesData.cardPayments;
        shift.upiPayments = salesData.upiPayments;
        shift.status = 'closed';
        shift.endTime = req.body.endTime || new Date();

        // 6. Add closing cash from request (manager enters this)
        if (req.body.closingCash !== undefined) {
            shift.closingCash = req.body.closingCash;
        }

        // 7. Calculate cash discrepancy (opening + cash sales - closing cash)
        const expectedCash = shift.openingCash + salesData.cashCollected;
        const actualCash = shift.closingCash;
        const cashDiscrepancy = actualCash - expectedCash;

        // 8. Add discrepancy if exists
        if (Math.abs(cashDiscrepancy) > 0.01) { // Ignore rounding errors
            shift.discrepancies.push({
                type: 'cash',
                amount: cashDiscrepancy,
                reason: cashDiscrepancy > 0
                    ? 'Cash surplus'
                    : 'Cash shortage',
            });
        }

        // 9. Add pump readings and tank readings from request
        if (req.body.pumpReadings) {
            shift.pumpReadings = req.body.pumpReadings;
        }

        if (req.body.tankReadings) {
            shift.tankReadings = req.body.tankReadings;

            // CRITICAL: Update Tank history for Reconciliation Report
            for (const reading of req.body.tankReadings) {
                await Tank.findByIdAndUpdate(reading.tankId, {
                    $push: {
                        dipReadings: {
                            date: new Date(),
                            reading: reading.closingReading,
                            shiftId: shift._id
                        }
                    },
                    // Update current level to match closing reading (Single Source of Truth)
                    currentLevel: reading.closingReading
                });
            }
        }

        // 10. Add notes and supervisor
        if (req.body.notes) {
            shift.notes = req.body.notes;
        }

        if (req.body.supervisorId) {
            shift.supervisorId = req.body.supervisorId;
        }

        // 11. Save the shift
        await shift.save();

        // 12. Return comprehensive closure summary
        res.json({
            success: true,
            message: 'Shift closed successfully',
            data: {
                shiftNumber: shift.shiftNumber,
                startTime: shift.startTime,
                endTime: shift.endTime,
                duration: `${Math.round((shift.endTime - shift.startTime) / (1000 * 60 * 60))} hours`,

                sales: {
                    totalRevenue: salesData.totalSales,
                    totalTransactions: salesData.totalTransactions,
                    totalQuantity: salesData.totalQuantity,
                    averageTicket: salesData.totalTransactions > 0
                        ? (salesData.totalSales / salesData.totalTransactions).toFixed(2)
                        : 0
                },

                payments: {
                    cash: salesData.cashCollected,
                    card: salesData.cardPayments,
                    upi: salesData.upiPayments,
                    credit: salesData.creditSales,
                    total: salesData.totalSales
                },

                cashFlow: {
                    openingCash: shift.openingCash,
                    cashSales: salesData.cashCollected,
                    expectedCash: expectedCash,
                    closingCash: actualCash,
                    discrepancy: cashDiscrepancy,
                    discrepancyPercentage: expectedCash > 0
                        ? ((cashDiscrepancy / expectedCash) * 100).toFixed(2) + '%'
                        : '0%'
                },

                discrepancies: shift.discrepancies,
                status: shift.status
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get shift summary for closing (auto-calculate values)
// @route GET /api/shifts/:id/summary
// @access Private
const getShiftSummary = async (req, res) => {
    try {
        const shiftId = req.params.id;

        // 1. Find the shift
        const shift = await Shift.findById(shiftId);
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        // 2. Aggregate sales data
        const salesAggregation = await Sale.aggregate([
            { $match: { shiftId: shift._id } },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$totalAmount' },
                    totalQuantity: { $sum: '$quantity' },
                    totalTransactions: { $sum: 1 },
                    cashCollected: {
                        $sum: {
                            $cond: [
                                { $eq: ['$saleType', 'cash'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    },
                    cardPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ['$saleType', 'card'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    },
                    upiPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ['$saleType', 'upi'] },
                                '$totalAmount',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const salesData = salesAggregation[0] || {
            totalSales: 0,
            totalQuantity: 0,
            totalTransactions: 0,
            cashCollected: 0,
            cardPayments: 0,
            upiPayments: 0
        };

        // 3. Calculate expected closing cash
        const expectedClosingCash = shift.openingCash + salesData.cashCollected;

        // 4. Return summary
        res.json({
            success: true,
            data: {
                shiftId: shift._id,
                shiftNumber: shift.shiftNumber,
                openingCash: shift.openingCash,
                salesSummary: salesData,
                expectedClosingCash: expectedClosingCash,
                suggestedClosingCash: expectedClosingCash // Suggest this value
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
    getShifts,
    getShift,
    createShift,
    updateShift,
    deleteShift,
    closeShift,
    getShiftSummary
}


