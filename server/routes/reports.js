const express = require('express')
const {protect,authorize} = require('../middlewares/auth')
const {
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
} = require('../controllers/reportController')

const router = express.Router()

router.get('/dashboard', protect, getDashboardSummary);
router.get('/shift-sales-trend', protect, getShiftSalesTrends);
router.get('/fuel-distribution', protect, getFuelDistribution);
router.get('/weekly-performance', protect, getWeeklyPerformance);

router.get('/tank-levels', protect, getTankLevels);
router.get('/recent-activity', protect, getRecentActivity);

router.get('/top-performers', protect, getTopPerformers);
router.get('/pump-performance', protect, authorize('admin', 'manager'), getPumpPerformance);

router.get('/shift/:shiftId', protect, getShiftDetail);
router.get('/credit-customers', protect, authorize('admin', 'manager', 'accountant'), getCreditCustomers);
router.get('/inventory-status', protect, getInventoryStatus);

module.exports = router;