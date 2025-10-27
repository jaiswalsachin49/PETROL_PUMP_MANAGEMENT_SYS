const Sale = require('../models/Sale');
const Shift = require('../models/Shift');
const Tank = require('../models/Tank');
const Pump = require('../models/Pump');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Inventory = require('../models/Inventory');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desk    Get last shift report summary with comparison to previous shift
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
    try {
        const lastTwoShift = await Shift.find({ status: 'closed' })
            .sort({ shiftNumber: -1 })
            .limit(2)
            .lean();
        if (!lastTwoShift || lastTwoShift.length === 0) {
            return res.status(404).json({
                success: false,
                lastShift: null,
                comparison: null,
                message: 'No closed shifts found for report generation'
            })
        }
        const lastShift = lastTwoShift[0];
        const previousShift = lastTwoShift[1] || null;

        // AGGREGATE DATA FOR LAST SHIFT
        const lastShiftSales = await Sale.aggregate([
            { $match: { shiftId: lastShift._id } },
            {
                $group: {
                    _id: null,
                    totalSalesAmount: { $sum: "$totalAmount" },
                    totalQuantitySold: { $sum: "$quantity" },
                    totalTransactions: { $sum: 1 }
                }
            }
        ])

        // AGGREGATE DATA FOR PREVIOUS SHIFT
        let previousShiftSales = null;
        if (previousShift) {
            previousShiftSales = await Sale.aggregate([
                { $match: { shiftId: previousShift._id } },
                {
                    $group: {
                        _id: null,
                        totalSalesAmount: { $sum: "$totalAmount" },
                        totalQuantitySold: { $sum: "$quantity" },
                        totalTransactions: { $sum: 1 }
                    }
                }
            ])
        }

        const lastStats = lastShiftSales[0] || {
            totalSalesAmount: 0,
            totalQuantitySold: 0,
            totalTransactions: 0
        };

        const prevStats = previousShiftSales && previousShiftSales[0] ? previousShiftSales[0] : {
            totalSalesAmount: 0,
            totalQuantitySold: 0,
            totalTransactions: 0
        };

        const revenueChange = prevStats.totalSalesAmount === 0 ? 100 :
            (((lastStats.totalSalesAmount - prevStats.totalSalesAmount) / prevStats.totalSalesAmount) * 100).toFixed(2);

        const quantityChange = prevStats.totalQuantitySold === 0 ? 100 :
            (((lastStats.totalQuantitySold - prevStats.totalQuantitySold) / prevStats.totalQuantitySold) * 100).toFixed(2);

        const transactionChange = prevStats.totalTransactions === 0 ? 100 :
            (((lastStats.totalTransactions - prevStats.totalTransactions) / prevStats.totalTransactions) * 100).toFixed(2);

        // GET ACTIVE STAFF COUNT
        const activeStaff = lastShift.assignedEmployees?.length || 0;
        const totalStaff = await Employee.countDocuments({ isActive: true });

        // GET TANK LEVELS AT END OF SHIFT
        const tanks = await Tank.find().lean();
        const tankLevels = tanks.map(tank => ({
            tankId: tank._id,
            fuelType: tank.fuelType,
            capacity: tank.capacity,
            currentLevel: tank.currentLevel
        }));

        //GET LOW TANKS AlERTS
        const lowFuelTanks = await Tank.countDocuments({
            $expr: { $lte: ['$currentLevel', '$minimumLevel'] },
            status: 'Active'
        });

        res.status(200).json({
            success: true,
            data: {
                lastShift: {
                    revenue: lastStats.totalSalesAmount,
                    revenueChange: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`,
                    vehicles: lastStats.totalTransactions,
                    vehicleChange: `${transactionChange >= 0 ? '+' : ''}${transactionChange}%`,
                    fuelQuantity: lastStats.totalQuantitySold,
                    quantityChange: `${quantityChange >= 0 ? '+' : ''}${quantityChange}%`,
                    activeStaff: `${activeStaff} / ${totalStaff}`,
                    staffUtilization: totalStaff === 0 ? 100 : ((activeStaff / totalStaff) * 100).toFixed(2) + '%',
                    startTime: lastShift.startTime,
                    endTime: lastShift.endTime,
                    tankLevels: tankLevels
                },
                previousShift: {
                    revenue: prevStats.totalSalesAmount,
                    vehicles: prevStats.totalTransactions,
                    fuelQuantity: prevStats.totalQuantitySold
                },
                alerts: {
                    lowFuelTanks
                }
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ====== AREA CHART DATA FOR SALES TRENDS ======

// @desc Get shift sales trend (last 10 shifts)
// @route GET /api/reports/shift-sales-trends
// @access Private
const getShiftSalesTrends = async (req, res) => {
    try {
        const shifts = await Shift.find({ status: 'closed' })
            .sort({ startTime: -1 })
            .limit(10)
            .lean();

        const shiftObjectIds = shifts.map((s) => s._id);

        const saleByShift = await Sale.aggregate([
            { $match: { shiftId: { $in: shiftObjectIds } } },
            { $group: { _id: '$shiftId', totalSalesAmount: { $sum: '$totalAmount' } } },
        ]);

        const saleMap = {};
        saleByShift.forEach((sale) => {
            saleMap[sale._id.toString()] = sale.totalSalesAmount;
        });

        const trendData = shifts.reverse().map((shift) => ({
            shiftNumber: shift.shiftNumber,
            time: new Date(shift.startTime).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            date: new Date(shift.startTime).toLocaleDateString('en-IN'),
            sales: saleMap[shift._id.toString()] || 0,
            label: `${new Date(shift.startTime).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short'
            })} - Shift ${shift.shiftNumber}`,
            shortLabel: `${new Date(shift.startTime).getDate()}/${new Date(shift.startTime).getMonth() + 1} S${shift.shiftNumber}`,
            datetime: shift.startTime,
            shiftId: shift._id.toString()
        }));

        res.status(200).json({
            success: true,
            data: trendData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// ============ PIE CHART ===============================
// @desk   Get fuel type distribution for last shift
// @route   GET /api/reports/fuel-distribution
// @access  Private
const getFuelDistribution = async (req, res) => {
    try {
        let shiftId;

        if (req.query.shiftId) {
            shiftId = req.query.shiftId;
        } else {
            const latestClosedShift = await Shift.findOne({ status: 'closed' })
                .sort({ shiftNumber: -1 })
                .select('_id');
            shiftId = latestClosedShift?._id;
        }

        if (!shiftId) {
            return res.status(404).json({
                success: false,
                message: 'No shiftId provided and no closed shift found.',
            });
        }

        const matchCondition = { shiftId: new mongoose.Types.ObjectId(shiftId) }

        const distribution = await Sale.aggregate([
            { $match: matchCondition },
            {
                $group: {
                    _id: "$fuelType",
                    totalQuantity: { $sum: "$quantity" },
                    totalSalesAmount: { $sum: "$totalAmount" }
                }
            },
            {
                $project: {
                    name: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 'petrol'] }, then: 'Petrol' },
                                { case: { $eq: ['$_id', 'diesel'] }, then: 'Diesel' },
                                { case: { $eq: ['$_id', 'cng'] }, then: 'CNG' }
                            ],
                            default: 'Other'
                        }
                    },
                    totalQuantity: 1,
                    totalSalesAmount: 1,
                    color: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 'petrol'] }, then: "#f97316" },
                                { case: { $eq: ['$_id', 'diesel'] }, then: "#10b981" },
                                { case: { $eq: ['$_id', 'cng'] }, then: "#f59e0b" }
                            ],
                            default: '#6b7280'
                        }
                    }
                }
            }
        ])

        const totalQuantity = distribution.reduce((acc, curr) => acc + curr.totalQuantity, 0)
        const distributionWithPercentage = distribution.map(item => ({
            ...item,
            percentage: totalQuantity === 0 ? 0 : Number(((item.totalQuantity / totalQuantity) * 100).toFixed(2))
        }))

        res.status(200).json({
            success: true,
            data: distributionWithPercentage
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// ============== BAR CHART ========================
// @desk   Get weekly sales comparison (last 4 week)
// @route   GET /api/reports/weekly-perfoemance
// @access  Private
const getWeeklyPerformance = async (req, res) => {
    try {
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const salesData = await Sale.aggregate([
            { $match: { createdAt: { $gte: fourWeeksAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" },
                    quantity: { $sum: "$quantity" }
                }

            },
            { $sort: { "_id": 1 } }
        ])

        const formattedData = salesData.map(item => ({
            week: new Date(item._id).toLocaleDateString('en-IN', { weekday: 'short' }),
            revenue: item.revenue,
            target: 80000,
            quantity: item.quantity
        }))

        res.json({
            success: true,
            data: formattedData
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// @desk    Get Tank level
// @route   GET /api/reports/tanks-levels
// @access  Private
const getTankLevels = async (req, res) => {
    try {
        const tanks = await Tank.aggregate([{
            $project: {
                name: { $concat: ['$fuelType', 'Tank', { $toString: '$tankNumber' }] },
                tankNumber: 1,
                fuelType: 1,
                current: '$currentLevel',
                capacity: 1,
                percentage: {
                    $round: [{ $multiply: [{ $divide: ['$currentLevel', '$capacity'] }, 100] }, 0]
                },
                status: {
                    $switch: {
                        branches: [
                            {
                                case: { $lte: ['$currentLevel', '$minimumLevel'] },
                                then: 'critical'
                            },
                            {
                                case: {
                                    $and: [
                                        { $gt: ['$currentLevel', '$minimumLevel'] },
                                        { $lte: ['$currentLevel', { $multiply: ['$minimumLevel', 1.5] }] }
                                    ]
                                },
                                then: 'low'
                            },
                            { case: { $gte: ['$currentLevel', { $multiply: ['$minimumLevel', 1.5] }] }, then: 'good' }
                        ],
                        default: 'unknown',
                    }
                },
                lastUpdated: '$lastDipReading.date',
            }
        },
        { $sort: { tankNumber: 1 } }
        ])
        res.json({
            success: true,
            data: tanks
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// @desc    Get recent transactions (sales + deliveries)
// @route   GET /api/reports/recent-activity?limit=10
// @access  Private
const getRecentActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        //RECENT SALES
        const recentSales = await Sale.find().sort({ createdAt: -1 }).limit(limit).populate('customerId', 'name companyName').lean()

        //RECENT PURCHASES
        const recentPurchases = await Purchase.find().sort({ date: -1 }).limit(5).populate('supplierId', 'name').lean()

        // FORMAT SALES
        const formattedSales = recentSales.map(sale => ({
            id: sale._id,
            type: 'sale',
            vehicle: sale.vehicleNumber || 'Walk-in',
            customer: sale.customerId?.name || null,
            amount: sale.totalAmount,
            fuel: sale.fuelType.charAt(0).toUpperCase() + sale.fuelType.slice(1),
            liters: sale.quantity,
            time: getTimeAgo(sale.createdAt),
            timestamp: sale.createdAt
        }))

        //FORMAT PURCHASES
        const formattedPurchases = recentPurchases.map(purchase => ({
            id: purchase._id,
            type: 'delivery',
            supplier: purchase.supplierId?.name || 'Unknown',
            amount: purchase.totalAmount,
            fuel: purchase.items[0]?.itemName || 'Fuel',
            liters: purchase.items.reduce((sum, item) => sum + item.quantity, 0),
            time: getTimeAgo(purchase.date),
            timestamp: purchase.date
        }))

        const allActivity = [...formattedSales, ...formattedPurchases]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);

        res.json({
            success: true,
            data: allActivity
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);

    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour ago`;
    return `${Math.floor(seconds / 86400)} day ago`;
}


// @desc    Get top performing employees (last 30 days)
// @route   GET /api/reports/top-performers?limit=5
// @access  Private
const getTopPerformers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const performers = await Sale.aggregate([
            {
                $match: {
                    date: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: '$employeeId',
                    sales: { $sum: '$totalAmount' },
                    transactions: { $sum: 1 },
                    fuelDispensed: { $sum: '$quantity' }
                }
            },
            {
                $lookup: {
                    from: 'employees',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: '$employee' },
            {
                $project: {
                    name: '$employee.name',
                    sales: 1,
                    transactions: 1,
                    fuelDispensed: 1,
                    avatar: {
                        $concat: [
                            { $substr: ['$employee.name', 0, 1] },
                            { $substr: [{ $arrayElemAt: [{ $split: ['$employee.name', ' '] }, 1] }, 0, 1] }
                        ]
                    }
                }
            },
            { $sort: { sales: -1 } },
            { $limit: limit }
        ]);

        // Add rank and change percentage (mock for now, can be calculated from previous period)
        const performersWithRank = performers.map((performer, index) => ({
            ...performer,
            rank: index + 1,
            change: '+12%' // This should be calculated from previous period data
        }));

        res.json({
            success: true,
            data: performersWithRank
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== SHIFT DETAILS ====================

// @desc Get detailed shift report
// @route GET /api/reports/shift/:shiftId
// @access Private
const getShiftDetail = async (req, res) => {
    try {
        const shift = await Shift.findById(req.params.shiftId)
            .populate('assignedEmployees', 'name position')
            .populate('supervisorId', 'name')
            .lean();

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        // ALWAYS aggregate from Sale collection (SINGLE SOURCE OF TRUTH)
        const shiftSales = await Sale.aggregate([
            { $match: { shiftId: shift._id } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    totalQuantity: { $sum: '$quantity' },
                    transactions: { $sum: 1 },

                    // Payment method breakdown
                    cashCollected: {
                        $sum: {
                            $cond: [{ $eq: ['$saleType', 'cash'] }, '$totalAmount', 0]
                        }
                    },
                    cardPayments: {
                        $sum: {
                            $cond: [{ $eq: ['$saleType', 'card'] }, '$totalAmount', 0]
                        }
                    },
                    upiPayments: {
                        $sum: {
                            $cond: [{ $eq: ['$saleType', 'upi'] }, '$totalAmount', 0]
                        }
                    }
                }
            }
        ]);

        // Get fuel-wise breakdown
        const fuelBreakdown = await Sale.aggregate([
            { $match: { shiftId: shift._id } },
            {
                $group: {
                    _id: '$fuelType',
                    quantity: { $sum: '$quantity' },
                    revenue: { $sum: '$totalAmount' },
                    transactions: { $sum: 1 }
                }
            }
        ]);

        // Get pump-wise sales
        const pumpSales = await Sale.aggregate([
            { $match: { shiftId: shift._id } },
            {
                $group: {
                    _id: '$pumpId',
                    quantity: { $sum: '$quantity' },
                    revenue: { $sum: '$totalAmount' },
                    transactions: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'pumps',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'pump'
                }
            },
            { $unwind: '$pump' }
        ]);

        const stats = shiftSales[0] || {
            totalRevenue: 0,
            totalQuantity: 0,
            transactions: 0,
            cashCollected: 0,
            cardPayments: 0,
            upiPayments: 0
        };

        // Calculate discrepancy from AGGREGATED data, not shift fields
        const expectedCash = shift.openingCash + stats.cashCollected;
        const cashDiscrepancy = shift.closingCash - expectedCash;

        res.json({
            success: true,
            data: {
                shift,
                stats,
                fuelBreakdown,
                pumpSales,

                // Use real-time aggregated data for calculations
                cashFlow: {
                    openingCash: shift.openingCash,
                    cashSales: stats.cashCollected,
                    expectedCash: expectedCash,
                    closingCash: shift.closingCash,
                    discrepancy: cashDiscrepancy
                },

                // Show if shift cached values differ from real data
                dataConsistency: shift.status === 'closed' ? {
                    cachedTotalSales: shift.totalSales,
                    actualTotalSales: stats.totalRevenue,
                    difference: stats.totalRevenue - shift.totalSales,
                    isConsistent: Math.abs(stats.totalRevenue - shift.totalSales) < 0.01
                } : null
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ==================== CREDIT CUSTOMERS REPORT ====================

// @desc    Get credit customers with outstanding balance
// @route   GET /api/reports/credit-customers
// @access  Private
const getCreditCustomers = async (req, res) => {
    try {
        const creditSales = await Sale.aggregate([
            {
                $match: {
                    saleType: { $in: ['credit', 'fleet'] },
                    paymentStatus: { $ne: 'paid' }
                }
            },
            {
                $group: {
                    _id: '$customerId',
                    totalOutstanding: { $sum: '$totalAmount' },
                    transactions: { $sum: 1 },
                    lastSaleDate: { $max: '$date' }
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $project: {
                    customerName: '$customer.name',
                    companyName: '$customer.companyName',
                    phone: '$customer.phone',
                    creditLimit: '$customer.creditLimit',
                    totalOutstanding: 1,
                    transactions: 1,
                    lastSaleDate: 1,
                    creditUtilization: {
                        $cond: {
                            if: { $gt: ['$customer.creditLimit', 0] },
                            then: {
                                $round: [
                                    {
                                        $multiply: [
                                            { $divide: ['$totalOutstanding', '$customer.creditLimit'] },
                                            100
                                        ]
                                    },
                                    1
                                ]
                            },
                            else: 0
                        }
                    },
                    daysOverdue: {
                        $divide: [
                            { $subtract: [new Date(), '$lastSaleDate'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            { $sort: { totalOutstanding: -1 } }
        ]);

        res.json({
            success: true,
            count: creditSales.length,
            data: creditSales
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== INVENTORY STATUS ====================

// @desc    Get inventory items with low stock alerts
// @route   GET /api/reports/inventory-status
// @access  Private
const getInventoryStatus = async (req, res) => {
    try {
        const inventory = await Inventory.aggregate([
            {
                $project: {
                    itemName: 1,
                    category: 1,
                    quantity: 1,
                    reorderLevel: 1,
                    unit: 1,
                    costPrice: 1,
                    sellingPrice: 1,
                    needsReorder: { $lte: ['$quantity', '$reorderLevel'] },
                    stockValue: { $multiply: ['$quantity', '$costPrice'] },
                    status: {
                        $switch: {
                            branches: [
                                { case: { $lte: ['$quantity', 0] }, then: 'Out of Stock' },
                                { case: { $lte: ['$quantity', '$reorderLevel'] }, then: 'Low Stock' },
                                { case: { $gt: ['$quantity', '$reorderLevel'] }, then: 'In Stock' }
                            ],
                            default: 'Unknown'
                        }
                    }
                }
            },
            { $sort: { needsReorder: -1, quantity: 1 } }
        ]);

        const summary = {
            totalItems: inventory.length,
            lowStockItems: inventory.filter(item => item.needsReorder).length,
            outOfStock: inventory.filter(item => item.quantity === 0).length,
            totalStockValue: inventory.reduce((sum, item) => sum + item.stockValue, 0)
        };

        res.json({
            success: true,
            data: { summary, items: inventory }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== PUMP PERFORMANCE ====================

// @desc    Get pump-wise performance
// @route   GET /api/reports/pump-performance?days=30
// @access  Private
const getPumpPerformance = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const pumpPerformance = await Sale.aggregate([
            {
                $match: {
                    date: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$pumpId',
                    totalFuelDispensed: { $sum: '$quantity' },
                    totalRevenue: { $sum: '$totalAmount' },
                    transactions: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'pumps',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'pump'
                }
            },
            { $unwind: '$pump' },
            {
                $project: {
                    pumpNumber: '$pump.pumpNumber',
                    status: '$pump.status',
                    totalFuelDispensed: 1,
                    totalRevenue: 1,
                    transactions: 1,
                    avgTransactionValue: {
                        $round: [
                            { $divide: ['$totalRevenue', '$transactions'] },
                            2
                        ]
                    }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.json({
            success: true,
            data: pumpPerformance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDashboardSummary,
    getShiftSalesTrends,
    getFuelDistribution,
    getWeeklyPerformance,
    getTankLevels,
    getRecentActivity,
    getTopPerformers,
    getShiftDetail,
    getCreditCustomers,
    getInventoryStatus,
    getPumpPerformance,
};