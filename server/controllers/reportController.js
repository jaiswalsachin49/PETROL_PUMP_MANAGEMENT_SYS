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
    console.log('\n🔥 getDashboardSummary CALLED at', new Date().toISOString());
    try {
        const lastTwoShift = await Shift.find({ status: 'closed' })
            .sort({ shiftNumber: -1 })
            .limit(2)
            .lean();

        console.log('📊 Found', lastTwoShift.length, 'closed shifts');

        // If no shifts exist, still show TODAY's sales
        if (!lastTwoShift || lastTwoShift.length === 0) {
            console.log('⚠️ NO CLOSED SHIFTS - But will show today\'s sales');

            // Get today in IST timezone (UTC+5:30)
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istNow = new Date(now.getTime() + istOffset);

            const today = new Date(istNow);
            today.setHours(0, 0, 0, 0);
            const todayUTC = new Date(today.getTime() - istOffset);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowUTC = new Date(tomorrow.getTime() - istOffset);

            console.log('Today IST:', today, '→ UTC:', todayUTC);

            // Get TODAY's sales
            const todaySalesData = await Sale.aggregate([
                {
                    $match: {
                        $or: [
                            { date: { $gte: todayUTC, $lt: tomorrowUTC } },
                            { createdAt: { $gte: todayUTC, $lt: tomorrowUTC } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSalesAmount: { $sum: "$totalAmount" },
                        totalQuantitySold: { $sum: "$quantity" },
                        totalTransactions: { $sum: 1 }
                    }
                }
            ]);

            const todayStats = todaySalesData[0] || {
                totalSalesAmount: 0,
                totalQuantitySold: 0,
                totalTransactions: 0
            };

            console.log('📈 Today\'s sales:', todayStats);

            const tanks = await Tank.find().lean();
            const tankLevels = tanks.map(tank => ({
                tankId: tank._id,
                fuelType: tank.fuelType,
                capacity: tank.capacity,
                currentLevel: tank.currentLevel
            }));

            const lowFuelTanks = await Tank.countDocuments({
                $expr: { $lte: ['$currentLevel', '$minimumLevel'] },
                status: 'Active'
            });

            // Get pump-wise sales for today
            const pumps = await Pump.find().populate('tankId', 'tankNumber fuelType').lean();
            const pumpSales = await Sale.aggregate([
                {
                    $match: {
                        $or: [
                            { date: { $gte: todayUTC, $lt: tomorrowUTC } },
                            { createdAt: { $gte: todayUTC, $lt: tomorrowUTC } }
                        ]
                    }
                },
                {
                    $group: {
                        _id: '$pumpId',
                        todaySales: { $sum: '$totalAmount' },
                        todaySalesQty: { $sum: '$quantity' }
                    }
                }
            ]);

            const salesMap = {};
            pumpSales.forEach(s => {
                salesMap[s._id.toString()] = {
                    amount: s.todaySales,
                    quantity: s.todaySalesQty
                };
            });

            const todayPumpSales = pumps.map(pump => {
                const sales = salesMap[pump._id.toString()] || { amount: 0, quantity: 0 };
                return {
                    id: pump._id,
                    name: pump.pumpNumber,
                    type: pump.tankId?.fuelType || 'Unknown',
                    tank: `Tank ${pump.tankId?.tankNumber || 'N/A'}`,
                    status: pump.status === 'active' ? 'Active' : 'Maintenance',
                    todaySalesAmount: sales.amount,
                    todaySalesQuantity: sales.quantity,
                    color: pump.status === 'active' ? 'emerald' : 'orange'
                };
            });

            const totalStaff = await Employee.countDocuments({ isActive: true });

            // Get active shift for real-time staff count
            const activeShift = await Shift.findOne({ status: 'active' });
            const activeStaffCount = activeShift ? activeShift.assignedEmployees?.length || 0 : 0;

            return res.status(200).json({
                success: true,
                data: {
                    lastShift: {
                        revenue: todayStats.totalSalesAmount,
                        revenueChange: '+0%',
                        vehicles: todayStats.totalTransactions,
                        vehicleChange: '+0%',
                        fuelQuantity: todayStats.totalQuantitySold,
                        quantityChange: '+0%',
                        activeStaff: `${activeStaffCount} / ${totalStaff}`,
                        staffUtilization: activeStaffCount > 0 ? Math.round((activeStaffCount / totalStaff) * 100) : 0,
                        startTime: activeShift?.startTime || null,
                        endTime: null,
                        tankLevels: tankLevels,
                        todayPumpSales: todayPumpSales
                    },
                    previousShift: {
                        revenue: 0,
                        vehicles: 0,
                        fuelQuantity: 0
                    },
                    alerts: {
                        lowFuelTanks
                    }
                },
                message: 'Showing today\'s sales (no closed shifts yet)'
            });
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

        // GET ACTIVE STAFF COUNT (Real-time from Active Shift, not last closed shift)
        const activeShift = await Shift.findOne({ status: 'active' });
        const activeStaffCount = activeShift ? activeShift.assignedEmployees?.length || 0 : 0;
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

        // Get today in IST timezone (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const istNow = new Date(now.getTime() + istOffset);

        const today = new Date(istNow);
        today.setHours(0, 0, 0, 0);
        const todayUTC = new Date(today.getTime() - istOffset);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowUTC = new Date(tomorrow.getTime() - istOffset);

        console.log('===== DASHBOARD DEBUG =====');
        console.log('IST Now:', istNow.toISOString());
        console.log('Today IST:', today, '→ UTC:', todayUTC);
        console.log('Tomorrow IST:', tomorrow, '→ UTC:', tomorrowUTC);

        // Try both date and createdAt fields for maximum compatibility
        const todaySalesData = await Sale.aggregate([
            {
                $match: {
                    $or: [
                        { date: { $gte: todayUTC, $lt: tomorrowUTC } },
                        { createdAt: { $gte: todayUTC, $lt: tomorrowUTC } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalSalesAmount: { $sum: "$totalAmount" },
                    totalQuantitySold: { $sum: "$quantity" },
                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        console.log('Today sales aggregation result:', todaySalesData);

        // Check counts separately
        const countByDate = await Sale.countDocuments({ date: { $gte: todayUTC, $lt: tomorrowUTC } });
        const countByCreatedAt = await Sale.countDocuments({ createdAt: { $gte: todayUTC, $lt: tomorrowUTC } });
        console.log('Sales count by date field:', countByDate);
        console.log('Sales count by createdAt field:', countByCreatedAt);

        // Check sample of ALL sales with dates
        const sampleSales = await Sale.find().sort({ createdAt: -1 }).limit(5).select('date totalAmount quantity createdAt saleId');
        console.log('Sample recent sales:', JSON.stringify(sampleSales, null, 2));
        console.log('===== END DEBUG =====');

        const todayStats = todaySalesData[0] || {
            totalSalesAmount: 0,
            totalQuantitySold: 0,
            totalTransactions: 0
        };

        const pumps = await Pump.find().populate('tankId', 'tankNumber fuelType').lean();

        const pumpSales = await Sale.aggregate([
            {
                $match: {
                    $or: [
                        { date: { $gte: todayUTC, $lt: tomorrowUTC } },
                        { createdAt: { $gte: todayUTC, $lt: tomorrowUTC } }
                    ]
                }
            },
            {
                $group: {
                    _id: '$pumpId',
                    todaySales: { $sum: '$totalAmount' },
                    todaySalesQty: { $sum: '$quantity' }
                }
            }
        ]);

        const salesMap = {};
        pumpSales.forEach(s => {
            salesMap[s._id.toString()] = {
                amount: s.todaySales,
                quantity: s.todaySalesQty
            };
        });

        const todayPumpSales = pumps.map(pump => {
            const sales = salesMap[pump._id.toString()] || { amount: 0, quantity: 0 };
            return {
                id: pump._id,
                name: pump.pumpNumber,
                type: pump.tankId?.fuelType || 'Unknown',
                tank: `Tank ${pump.tankId?.tankNumber || 'N/A'}`,
                status: pump.status === 'active' ? 'Active' : 'Maintenance',
                todaySalesAmount: sales.amount,
                todaySalesQuantity: sales.quantity,
                color: pump.status === 'active' ? 'emerald' : 'orange'
            };
        });


        // Prevent caching during debugging
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');

        res.status(200).json({
            success: true,
            data: {
                lastShift: {
                    revenue: todayStats.totalSalesAmount, // Use today's real-time sales
                    revenueChange: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`,
                    vehicles: todayStats.totalTransactions, // Use today's real-time transactions
                    vehicleChange: `${transactionChange >= 0 ? '+' : ''}${transactionChange}%`,
                    fuelQuantity: todayStats.totalQuantitySold, // Use today's real-time quantity
                    quantityChange: `${quantityChange >= 0 ? '+' : ''}${quantityChange}%`,
                    activeStaff: `${activeStaffCount} / ${totalStaff}`,
                    staffUtilization: activeStaffCount > 0 ? Math.round((activeStaffCount / totalStaff) * 100) : 0,
                    startTime: activeShift?.startTime || lastShift.startTime,
                    endTime: activeShift ? null : lastShift.endTime,
                    tankLevels: tankLevels,
                    todayPumpSales: todayPumpSales
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
        // Fetch closed shifts AND the active shift
        const shifts = await Shift.find({
            status: { $in: ['closed', 'active'] }
        })
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
            // Try to get latest closed shift
            const latestClosedShift = await Shift.findOne({ status: 'closed' })
                .sort({ shiftNumber: -1 })
                .select('_id');

            if (latestClosedShift) {
                shiftId = latestClosedShift._id;
            } else {
                // If no closed shift, try to get active shift
                const activeShift = await Shift.findOne({ status: 'active' }).select('_id');
                shiftId = activeShift?._id;
            }
        }

        if (!shiftId) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No shifts data available yet',
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


// @desc    Get monthly revenue (last 6 months)
// @route   GET /api/reports/monthly-revenue
// @access  Private
const getMonthlyRevenue = async (req, res) => {
    try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1); // Start of the month

        const salesData = await Sale.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" },
                    quantity: { $sum: "$quantity" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Format data for chart (fill missing months if needed, but simple map for now)
        const formattedData = salesData.map(item => {
            const date = new Date(item._id.year, item._id.month - 1);
            return {
                month: date.toLocaleDateString('en-IN', { month: 'short' }),
                revenue: item.revenue,
                quantity: item.quantity
            };
        });

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
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
                    status: {
                        $cond: {
                            if: { $lte: ['$quantity', '$reorderLevel'] },
                            then: 'Low Stock',
                            else: 'In Stock'
                        }
                    }
                }
            },
            { $sort: { status: -1, quantity: 1 } }
        ]);

        res.json({
            success: true,
            data: inventory
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== PUMP PERFORMANCE ====================

// @desc    Get pump performance stats
// @route   GET /api/reports/pump-performance
// @access  Private
const getPumpPerformance = async (req, res) => {
    try {
        const pumpPerformance = await Sale.aggregate([
            {
                $group: {
                    _id: '$pumpId',
                    totalSales: { $sum: '$totalAmount' },
                    totalQuantity: { $sum: '$quantity' },
                    transactionCount: { $sum: 1 }
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
                    pumpName: '$pump.pumpNumber',
                    totalSales: 1,
                    totalQuantity: 1,
                    transactionCount: 1
                }
            }
        ]);
        res.json({ success: true, data: pumpPerformance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== NEW REPORTS FOR UI ====================

// @desc    Get comprehensive sales report
// @route   GET /api/reports/sales-report
// @access  Private
// @desc    Get comprehensive sales report
// @route   GET /api/reports/sales-report
// @access  Private
const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate, shift } = req.query;

        const matchStage = {};
        if (startDate && endDate) {
            matchStage.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'shifts',
                    localField: 'shiftId',
                    foreignField: '_id',
                    as: 'shiftDetails'
                }
            },
            { $unwind: '$shiftDetails' },
            {
                $addFields: {
                    shiftHour: { $hour: '$shiftDetails.startTime' }
                }
            },
            {
                $addFields: {
                    shiftName: {
                        $switch: {
                            branches: [
                                { case: { $and: [{ $gte: ['$shiftHour', 6] }, { $lt: ['$shiftHour', 14] }] }, then: 'Morning' },
                                { case: { $and: [{ $gte: ['$shiftHour', 14] }, { $lt: ['$shiftHour', 22] }] }, then: 'Evening' }
                            ],
                            default: 'Night'
                        }
                    }
                }
            }
        ];

        if (shift && shift !== 'All Shifts') {
            pipeline.push({
                $match: { shiftName: shift }
            });
        }

        pipeline.push(
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        shift: "$shiftName"
                    },
                    petrolQty: {
                        $sum: {
                            $cond: [{ $eq: ["$fuelType", "petrol"] }, "$quantity", 0]
                        }
                    },
                    dieselQty: {
                        $sum: {
                            $cond: [{ $eq: ["$fuelType", "diesel"] }, "$quantity", 0]
                        }
                    },
                    premiumQty: {
                        $sum: {
                            $cond: [{ $eq: ["$fuelType", "premium"] }, "$quantity", 0]
                        }
                    },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.date": -1 } }
        );

        const sales = await Sale.aggregate(pipeline);

        const formattedSales = sales.map(s => ({
            date: s._id.date,
            shift: s._id.shift,
            petrol: s.petrolQty,
            diesel: s.dieselQty,
            premium: s.premiumQty,
            total: s.petrolQty + s.dieselQty + s.premiumQty,
            revenue: s.totalRevenue
        }));

        res.json({
            success: true,
            data: formattedSales
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get financial report (Income vs Expense)
// @route   GET /api/reports/financial-report
// @access  Private
const getFinancialReport = async (req, res) => {
    try {
        // Total Income from Sales
        const totalIncomeAgg = await Sale.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalIncome = totalIncomeAgg[0]?.total || 0;

        // Total Expenses from Transactions (type: expense, payment_made, purchase)
        const totalExpensesAgg = await Transaction.aggregate([
            {
                $match: {
                    type: { $in: ['expense', 'payment_made', 'purchase'] }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalExpenses = totalExpensesAgg[0]?.total || 0;

        const netProfit = totalIncome - totalExpenses;

        res.json({
            success: true,
            data: {
                totalIncome,
                totalExpenses,
                netProfit
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get fuel inventory report
// @route   GET /api/reports/fuel-inventory-report
// @access  Private
const getFuelInventoryReport = async (req, res) => {
    try {
        const fuels = ['petrol', 'diesel', 'premium']; // premium might be mapped to power/xp

        const report = await Promise.all(fuels.map(async (fuel) => {
            // Get current stock from Tanks
            const tanks = await Tank.find({ fuelType: { $regex: new RegExp(fuel, 'i') } });
            const currentStock = tanks.reduce((sum, t) => sum + t.currentLevel, 0);

            // Get today's sales
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const salesAgg = await Sale.aggregate([
                {
                    $match: {
                        fuelType: { $regex: new RegExp(fuel, 'i') },
                        date: { $gte: today }
                    }
                },
                { $group: { _id: null, total: { $sum: "$quantity" } } }
            ]);
            const sales = salesAgg[0]?.total || 0;

            // Get today's purchases
            const purchasesAgg = await Purchase.aggregate([
                { $match: { date: { $gte: today } } },
                { $unwind: "$items" },
                {
                    $match: {
                        "items.itemName": { $regex: new RegExp(fuel, 'i') }
                    }
                },
                { $group: { _id: null, total: { $sum: "$items.quantity" } } }
            ]);

            const purchases = purchasesAgg[0]?.total || 0;

            const openingStock = currentStock + sales - purchases; // Back calculation

            return {
                item: fuel.charAt(0).toUpperCase() + fuel.slice(1),
                openingStock,
                purchases,
                sales,
                closingStock: currentStock
            };
        }));

        res.json({
            success: true,
            data: report
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Analytics Dashboard Data
// @route   GET /api/reports/analytics-dashboard
// @access  Private
const getAnalyticsDashboard = async (req, res) => {
    try {
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const lastMonth = new Date(currentMonth);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const last6Months = new Date();
        last6Months.setMonth(last6Months.getMonth() - 6);

        // Get sales for current month
        const currentMonthSales = await Sale.aggregate([
            { $match: { date: { $gte: currentMonth } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);

        // Get sales for last month
        const lastMonthSales = await Sale.aggregate([
            { $match: { date: { $gte: lastMonth, $lt: currentMonth } } },
            { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]);

        const currentTotal = currentMonthSales[0]?.total || 0;
        const lastTotal = lastMonthSales[0]?.total || 0;
        const currentCount = currentMonthSales[0]?.count || 1;
        const lastCount = lastMonthSales[0]?.count || 1;

        // Calculate avg daily sales
        const daysInCurrentMonth = new Date().getDate();
        const avgDailySales = Math.round(currentTotal / daysInCurrentMonth);
        const avgDailySalesChange = lastTotal > 0 ? (((currentTotal / daysInCurrentMonth) - (lastTotal / 30)) / (lastTotal / 30) * 100).toFixed(1) : 0;

        // Profit margin (mock calculation - would need cost data)
        const profitMargin = 36.7;
        const profitMarginChange = 2.3;

        // Active customers (those who made purchases this month)
        const activeCustomers = await Customer.countDocuments({
            _id: {
                $in: await Sale.distinct('customerId', { date: { $gte: currentMonth } })
            }
        });
        const lastMonthActiveCustomers = await Customer.countDocuments({
            _id: {
                $in: await Sale.distinct('customerId', { date: { $gte: lastMonth, $lt: currentMonth } })
            }
        }) || 1;
        const activeCustomersChange = (((activeCustomers - lastMonthActiveCustomers) / lastMonthActiveCustomers) * 100).toFixed(1);

        // Avg transaction
        const avgTransaction = Math.round(currentTotal / currentCount);
        const lastAvgTransaction = Math.round(lastTotal / lastCount) || 1;
        const avgTransactionChange = (((avgTransaction - lastAvgTransaction) / lastAvgTransaction) * 100).toFixed(1);

        // Revenue & Profit Trend (last 6 months)
        const monthlyData = await Sale.aggregate([
            { $match: { date: { $gte: last6Months } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
                    sales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const revenueTrend = monthlyData.map(item => ({
            name: new Date(item._id + "-01").toLocaleString('default', { month: 'short' }),
            sales: item.sales,
            profit: Math.round(item.sales * 0.367) // Mock profit calculation
        }));

        // Fuel Type Performance
        const fuelPerformance = await Sale.aggregate([
            { $match: { date: { $gte: currentMonth } } },
            {
                $group: {
                    _id: "$fuelType",
                    value: { $sum: "$totalAmount" }
                }
            }
        ]);

        const fuelData = fuelPerformance.map(item => ({
            name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
            value: item.value
        }));

        // Top Customers
        const topCustomers = await Sale.aggregate([
            { $match: { date: { $gte: currentMonth }, customerId: { $exists: true } } },
            {
                $group: {
                    _id: "$customerId",
                    amount: { $sum: "$totalAmount" },
                    visits: { $sum: 1 }
                }
            },
            { $sort: { amount: -1 } },
            { $limit: 4 },
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
                    name: '$customer.name',
                    amount: 1,
                    visits: 1
                }
            }
        ]);

        // Sales growth
        const salesGrowth = lastTotal > 0 ? (((currentTotal - lastTotal) / lastTotal) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: {
                cards: {
                    avgDailySales: {
                        value: avgDailySales,
                        change: parseFloat(avgDailySalesChange)
                    },
                    profitMargin: {
                        value: profitMargin,
                        change: profitMarginChange
                    },
                    activeCustomers: {
                        value: activeCustomers,
                        change: parseFloat(activeCustomersChange)
                    },
                    avgTransaction: {
                        value: avgTransaction,
                        change: parseFloat(avgTransactionChange)
                    }
                },
                revenueTrend,
                fuelPerformance: fuelData,
                topCustomers,
                comparisons: {
                    salesGrowth: parseFloat(salesGrowth),
                    customerAcquisition: 5.5,
                    avgTransactionValue: -5.2,
                    profitMarginChange: 2.3
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==================== RECONCILIATION ENDPOINTS ====================

// @desc    Get Fuel Reconciliation
// @route   GET /api/reports/fuel-reconciliation
// @access  Private
const getFuelReconciliation = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const fuels = ['petrol', 'diesel', 'premium'];

        const reconciliation = await Promise.all(fuels.map(async (fuel) => {
            // Get opening stock from tanks
            const tanks = await Tank.find({ fuelType: { $regex: new RegExp(fuel, 'i') } });
            const currentActual = tanks.reduce((sum, t) => sum + t.currentLevel, 0);

            // Get today's sales
            const salesAgg = await Sale.aggregate([
                {
                    $match: {
                        fuelType: { $regex: new RegExp(fuel, 'i') },
                        date: { $gte: today, $lt: tomorrow }
                    }
                },
                { $group: { _id: null, total: { $sum: "$quantity" } } }
            ]);
            const sales = salesAgg[0]?.total || 0;

            // Get today's purchases (mock for now)
            const purchases = 0;

            // Calculate opening stock (back calculation)
            const openingStock = currentActual + sales - purchases;
            const expected = openingStock + purchases - sales;
            const variance = currentActual - expected;

            // Determine status based on variance
            const variancePercent = expected > 0 ? Math.abs((variance / expected) * 100) : 0;
            const status = variancePercent < 1 ? 'OK' : 'Minor Variance';

            return {
                fuelType: fuel.charAt(0).toUpperCase() + fuel.slice(1),
                openingStock: Math.round(openingStock),
                purchases: Math.round(purchases),
                sales: Math.round(sales),
                expected: Math.round(expected),
                actual: Math.round(currentActual),
                variance: Math.round(variance),
                status
            };
        }));

        res.json({
            success: true,
            data: reconciliation
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Daily Reconciliation
// @route   GET /api/reports/daily-reconciliation
// @access  Private
const getDailyReconciliation = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's sales by payment type
        const salesByType = await Sale.aggregate([
            { $match: { date: { $gte: today, $lt: tomorrow } } },
            {
                $group: {
                    _id: "$saleType",
                    total: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        let cashSales = 0, cardSales = 0, upiSales = 0, creditSales = 0, totalTransactions = 0;

        salesByType.forEach(item => {
            totalTransactions += item.count;
            if (item._id === 'cash') cashSales = item.total;
            else if (item._id === 'card') cardSales = item.total;
            else if (item._id === 'upi') upiSales = item.total;
            else if (item._id === 'credit' || item._id === 'fleet') creditSales += item.total;
        });

        const totalSales = cashSales + cardSales + upiSales + creditSales;

        // Get today's expenses
        const expensesAgg = await Transaction.aggregate([
            {
                $match: {
                    date: { $gte: today, $lt: tomorrow },
                    type: { $in: ['expense', 'payment_made'] }
                }
            },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const cashExpenses = expensesAgg[0]?.total || 0;

        // Mock opening cash and get latest shift
        const openingCash = 50000;
        const expectedCash = openingCash + cashSales - cashExpenses;
        const actualCash = expectedCash; // Mock - would come from actual cash count

        // Get pump verification status
        const pumps = await Pump.find().select('pumpNumber status').lean();
        const pumpVerification = pumps.map((pump, index) => ({
            name: `Pump ${pump.pumpNumber || index + 1}`,
            status: pump.status === 'active' ? 'verified' : 'pending'
        }));

        res.json({
            success: true,
            data: {
                cash: {
                    openingCash,
                    cashSales,
                    cashExpenses,
                    expectedCash,
                    actualCash,
                    variance: 0
                },
                sales: {
                    totalTransactions,
                    cashSales,
                    cardSales,
                    upiSales,
                    creditSales,
                    totalSales
                },
                pumps: pumpVerification
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Anomalies
// @route   GET /api/reports/anomalies
// @access  Private
const getAnomalies = async (req, res) => {
    try {
        const anomalies = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Check for low tank levels
        const lowTanks = await Tank.find({
            $expr: { $lte: ['$currentLevel', '$minimumLevel'] }
        }).lean();

        lowTanks.forEach(tank => {
            anomalies.push({
                severity: 'HIGH',
                date: new Date().toISOString().split('T')[0],
                title: 'Stock Variance',
                description: `${tank.fuelType} stock variance detected - tank level below minimum threshold`
            });
        });

        // Check for price mismatches in recent sales
        // Get distinct prices for each fuel type in the last 7 days
        const priceAnalysis = await Sale.aggregate([
            { $match: { date: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: '$fuelType',
                    prices: { $addToSet: '$pricePerLiter' },
                    count: { $sum: 1 }
                }
            }
        ]);

        priceAnalysis.forEach(fuel => {
            // If there are multiple different prices for the same fuel type, flag it
            if (fuel.prices.length > 2) {
                anomalies.push({
                    severity: 'LOW',
                    date: new Date().toISOString().split('T')[0],
                    title: 'Price Mismatch',
                    description: `Multiple price variations detected for ${fuel._id} (${fuel.prices.length} different prices found)`
                });
            }
        });

        // Check for missing tank dip readings (tanks not updated in last 24 hours)
        const oneDayAgo = new Date(Date.now() - 86400000);
        const tanksWithOldReadings = await Tank.find({
            'lastDipReading.date': { $lt: oneDayAgo }
        }).lean();

        tanksWithOldReadings.forEach(tank => {
            anomalies.push({
                severity: 'HIGH',
                date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                title: 'Missing Reading',
                description: `Tank dip reading not recorded for ${tank.fuelType} Tank ${tank.tankNumber}`
            });
        });

        // Check for inactive pumps with sales (shouldn't happen)
        const inactivePumps = await Pump.find({ status: 'inactive' }).select('_id').lean();
        if (inactivePumps.length > 0) {
            const inactivePumpIds = inactivePumps.map(p => p._id);
            const salesOnInactivePumps = await Sale.countDocuments({
                pumpId: { $in: inactivePumpIds },
                date: { $gte: sevenDaysAgo }
            });

            if (salesOnInactivePumps > 0) {
                anomalies.push({
                    severity: 'MEDIUM',
                    date: new Date().toISOString().split('T')[0],
                    title: 'Inactive Pump Activity',
                    description: `${salesOnInactivePumps} sale(s) recorded on inactive pumps`
                });
            }
        }

        res.json({
            success: true,
            data: anomalies
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
    getMonthlyRevenue,
    getTopPerformers,
    getShiftDetail,
    getCreditCustomers,
    getInventoryStatus,
    getPumpPerformance,
    getSalesReport,
    getFinancialReport,
    getFuelInventoryReport,
    getAnalyticsDashboard,
    getFuelReconciliation,
    getDailyReconciliation,
    getAnomalies
};