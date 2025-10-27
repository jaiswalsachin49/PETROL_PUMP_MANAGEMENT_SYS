const Tank = require('../models/Tank');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Pump = require('../models/Pump');

// @desc Get fuel reconciliation report
// @route GET /api/reconciliation/fuel
// @access Private (Manager/Admin)
const getFuelReconciliation = async (req, res) => {
    try {
        const { startDate, endDate, tankId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        let tankQuery = { status: 'active' };
        if (tankId) {
            tankQuery._id = tankId;
        }

        const tanks = await Tank.find(tankQuery);

        const reconciliationData = [];

        for (const tank of tanks) {
            const openingReading = tank.dipReadings.find(dip => {
                const dipDate = new Date(dip.date);
                return dipDate <= new Date(startDate);
            });
            const openingStock = openingReading ? openingReading.reading : tank.currentLevel;

            const closingReading = tank.dipReadings.find(dip => {
                const dipDate = new Date(dip.date);
                return dipDate <= new Date(endDate);
            });
            const closingStock = closingReading ? closingReading.reading : tank.currentLevel;

            const purchases = await Purchase.find({
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            });

            let fuelReceived = 0;
            purchases.forEach(purchase => {
                purchase.items.forEach(item => {
                    if (item.itemName && item.itemName.toLowerCase().includes(tank.fuelType)) {
                        fuelReceived += item.quantity;
                    }
                });
            });
            const pumps = await Pump.find({ tankId: tank._id });
            const pumpIds = pumps.map(p => p._id);

            const sales = await Sale.find({
                pumpId: { $in: pumpIds },
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            });

            const fuelSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);

            const bookStock = openingStock + fuelReceived - fuelSold;

            const variance = closingStock - bookStock;
            const variancePercentage = bookStock > 0 ? ((variance / bookStock) * 100).toFixed(2) : 0;

            let status = 'OK';
            let reason = '';

            if (Math.abs(variance) > (tank.capacity * 0.01)) { 
                if (variance < 0) {
                    status = 'Shortage';
                    reason = 'Physical stock less than book stock - possible leakage or theft';
                } else {
                    status = 'Overage';
                    reason = 'Physical stock more than book stock - possible measurement error';
                }
            }

            reconciliationData.push({
                tankId: tank._id,
                tankNumber: tank.tankNumber,
                fuelType: tank.fuelType,
                capacity: tank.capacity,
                openingStock,
                fuelReceived,
                fuelSold,
                bookStock: Math.round(bookStock * 100) / 100,
                closingStock,
                variance: Math.round(variance * 100) / 100,
                variancePercentage: variancePercentage + '%',
                status,
                reason,
                valueOfVariance: Math.abs(variance) * (tank.fuelType === 'petrol' ? 102.50 : tank.fuelType === 'diesel' ? 89.75 : 75.00)
            });
        }

        const totalVarianceValue = reconciliationData.reduce((sum, tank) => sum + tank.valueOfVariance, 0);

        res.json({
            success: true,
            data: {
                startDate,
                endDate,
                tanks: reconciliationData,
                summary: {
                    totalTanks: tanks.length,
                    tanksWithShortage: reconciliationData.filter(t => t.status === 'Shortage').length,
                    tanksWithOverage: reconciliationData.filter(t => t.status === 'Overage').length,
                    tanksOK: reconciliationData.filter(t => t.status === 'OK').length,
                    totalVarianceValue: Math.round(totalVarianceValue * 100) / 100
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get daily reconciliation
// @route GET /api/reconciliation/daily
// @access Private
const getDailyReconciliation = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date is required'
            });
        }

        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const tanks = await Tank.find({ status: 'active' });

        const dailyData = [];

        for (const tank of tanks) {
            const openingDip = tank.dipReadings
                .filter(dip => new Date(dip.date) < startOfDay)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            const closingDip = tank.dipReadings
                .filter(dip => new Date(dip.date) >= startOfDay && new Date(dip.date) <= endOfDay)
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            if (!openingDip || !closingDip) {
                continue; 
            }


            const pumps = await Pump.find({ tankId: tank._id });
            const pumpIds = pumps.map(p => p._id);


            const sales = await Sale.find({
                pumpId: { $in: pumpIds },
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            const totalSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
            const purchases = await Purchase.find({
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            let totalReceived = 0;
            purchases.forEach(purchase => {
                purchase.items.forEach(item => {
                    if (item.itemName && item.itemName.toLowerCase().includes(tank.fuelType)) {
                        totalReceived += item.quantity;
                    }
                });
            });
            const expectedClosing = openingDip.reading + totalReceived - totalSold;
            const actualClosing = closingDip.reading;
            const difference = actualClosing - expectedClosing;

            dailyData.push({
                tankNumber: tank.tankNumber,
                fuelType: tank.fuelType,
                openingReading: openingDip.reading,
                receipts: totalReceived,
                sales: totalSold,
                expectedClosing: Math.round(expectedClosing * 100) / 100,
                actualClosing,
                difference: Math.round(difference * 100) / 100,
                differencePercentage: expectedClosing > 0 ? ((difference / expectedClosing) * 100).toFixed(2) + '%' : '0%',
                status: Math.abs(difference) < 10 ? 'OK' : difference < 0 ? 'Shortage' : 'Overage'
            });
        }

        res.json({
            success: true,
            date: date,
            data: dailyData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get pump reconciliation (comparing nozzle readings vs sales)
// @route GET /api/reconciliation/pump
// @access Private
const getPumpReconciliation = async (req, res) => {
    try {
        const { startDate, endDate, pumpId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        let pumpQuery = { status: 'active' };
        if (pumpId) {
            pumpQuery._id = pumpId;
        }

        const pumps = await Pump.find(pumpQuery);

        const reconciliationData = [];

        for (const pump of pumps) {
            for (const nozzle of pump.nozzles) {
                const sales = await Sale.find({
                    pumpId: pump._id,
                    nozzleId: nozzle.nozzleId,
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) }
                });

                const totalSalesVolume = sales.reduce((sum, sale) => sum + sale.quantity, 0);
                const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);


                const meterDifference = nozzle.closingReading - nozzle.openingReading;

                const volumeVariance = meterDifference - totalSalesVolume;
                const volumeVariancePercentage = totalSalesVolume > 0
                    ? ((volumeVariance / totalSalesVolume) * 100).toFixed(2)
                    : '0';

                let status = 'OK';
                if (Math.abs(volumeVariance) > (totalSalesVolume * 0.005)) { 
                    status = volumeVariance < 0 ? 'Shortage' : 'Overage';
                }

                reconciliationData.push({
                    pumpNumber: pump.pumpNumber,
                    nozzleId: nozzle.nozzleId,
                    fuelType: nozzle.fueltype,
                    openingReading: nozzle.openingReading,
                    closingReading: nozzle.closingReading,
                    meterReading: meterDifference,
                    salesVolume: Math.round(totalSalesVolume * 100) / 100,
                    salesAmount: Math.round(totalSalesAmount * 100) / 100,
                    numberOfTransactions: sales.length,
                    volumeVariance: Math.round(volumeVariance * 100) / 100,
                    volumeVariancePercentage: volumeVariancePercentage + '%',
                    status
                });
            }
        }

        res.json({
            success: true,
            data: {
                startDate,
                endDate,
                nozzles: reconciliationData,
                summary: {
                    totalNozzles: reconciliationData.length,
                    nozzlesOK: reconciliationData.filter(n => n.status === 'OK').length,
                    nozzlesWithIssues: reconciliationData.filter(n => n.status !== 'OK').length
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Detect potential fuel theft or leakage
// @route GET /api/reconciliation/anomalies
// @access Private (Manager/Admin)
const detectAnomalies = async (req, res) => {
    try {
        const { days = 7 } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const tanks = await Tank.find({ status: 'active' });

        const anomalies = [];

        for (const tank of tanks) {
            const dipReadings = tank.dipReadings.filter(dip => {
                const dipDate = new Date(dip.date);
                return dipDate >= startDate && dipDate <= endDate;
            }).sort((a, b) => new Date(a.date) - new Date(b.date));

            if (dipReadings.length < 2) continue;

            for (let i = 1; i < dipReadings.length; i++) {
                const prev = dipReadings[i - 1];
                const curr = dipReadings[i];
                const drop = prev.reading - curr.reading;
                const timeDiff = (new Date(curr.date) - new Date(prev.date)) / (1000 * 60 * 60); 
                if (drop > (tank.capacity * 0.10) && timeDiff < 1) {
                    anomalies.push({
                        type: 'Sudden Drop',
                        severity: 'High',
                        tankNumber: tank.tankNumber,
                        fuelType: tank.fuelType,
                        date: curr.date,
                        previousReading: prev.reading,
                        currentReading: curr.reading,
                        drop: Math.round(drop * 100) / 100,
                        timePeriod: `${timeDiff.toFixed(1)} hours`,
                        possibleCause: 'Potential theft or large unauthorized withdrawal',
                        action: 'Immediate investigation required'
                    });
                }
                const pumps = await Pump.find({ tankId: tank._id });
                const pumpIds = pumps.map(p => p._id);

                const sales = await Sale.find({
                    pumpId: { $in: pumpIds },
                    date: { $gte: new Date(prev.date), $lte: new Date(curr.date) }
                });

                const soldVolume = sales.reduce((sum, sale) => sum + sale.quantity, 0);
                if (drop > (soldVolume * 1.1)) { 
                    const discrepancy = drop - soldVolume;
                    anomalies.push({
                        type: 'Unexplained Loss',
                        severity: 'Medium',
                        tankNumber: tank.tankNumber,
                        fuelType: tank.fuelType,
                        date: curr.date,
                        actualDrop: Math.round(drop * 100) / 100,
                        recordedSales: Math.round(soldVolume * 100) / 100,
                        discrepancy: Math.round(discrepancy * 100) / 100,
                        possibleCause: 'Unrecorded sales, leakage, or calibration issue',
                        action: 'Verify pump calibration and check for leaks'
                    });
                }
            }

            if (tank.currentLevel < tank.minimumLevel) {
                anomalies.push({
                    type: 'Low Stock Alert',
                    severity: 'Medium',
                    tankNumber: tank.tankNumber,
                    fuelType: tank.fuelType,
                    currentLevel: tank.currentLevel,
                    minimumLevel: tank.minimumLevel,
                    deficit: tank.minimumLevel - tank.currentLevel,
                    action: 'Order fuel immediately'
                });
            }
        }

        const severityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        res.json({
            success: true,
            data: {
                period: `Last ${days} days`,
                startDate,
                endDate,
                totalAnomalies: anomalies.length,
                highSeverity: anomalies.filter(a => a.severity === 'High').length,
                mediumSeverity: anomalies.filter(a => a.severity === 'Medium').length,
                anomalies
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
    getFuelReconciliation,
    getDailyReconciliation,
    getPumpReconciliation,
    detectAnomalies
};
