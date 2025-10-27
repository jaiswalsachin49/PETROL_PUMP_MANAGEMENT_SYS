const express = require('express');
const router = express.Router();
const {
    getFuelReconciliation,
    getDailyReconciliation,
    getPumpReconciliation,
    detectAnomalies
} = require('../controllers/reconciliationController');

const { protect, authorize } = require('../middlewares/auth');

// All routes require manager or admin access
router.use(protect);
router.use(authorize('admin', 'manager'));

// GET /api/reconciliation/fuel - Fuel reconciliation
router.get('/fuel', getFuelReconciliation);

// GET /api/reconciliation/daily - Daily reconciliation
router.get('/daily', getDailyReconciliation);

// GET /api/reconciliation/pump - Pump reconciliation
router.get('/pump', getPumpReconciliation);

// GET /api/reconciliation/anomalies - Detect anomalies
router.get('/anomalies', detectAnomalies);

module.exports = router;
