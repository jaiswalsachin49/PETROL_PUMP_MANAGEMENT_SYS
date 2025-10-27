const express = require('express');
const {
    getPumps,
    getPump,
    createPump,
    updatePump,
    deletePump,
    addNozzle,
    updateNozzleReading,
    assignNozzleEmployee,
    getPumpsByTank,
    getPumpsByStatus,
    getPumpsWithSales
} = require('../controllers/pumpController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
    .get(protect, getPumps)
    .post(protect, authorize('admin', 'manager'), createPump);

router.route('/with-sales')
    .get(protect, getPumpsWithSales)

router.route('/:id')
    .get(protect, getPump)
    .put(protect, authorize('admin', 'manager'), updatePump)
    .delete(protect, authorize('admin'), deletePump);

router.route('/:id/nozzles')
    .post(protect, authorize('admin', 'manager'), addNozzle);

router.route('/:id/nozzles/:nozzleId')
    .put(protect, updateNozzleReading);

router.route('/:id/nozzles/:nozzleId/assign')
    .put(protect, authorize('manager','admin'), assignNozzleEmployee)

router.route('/tank/:tankId')
    .get(protect, getPumpsByTank);

router.route('/status/:state')
    .get(protect, getPumpsByStatus);


module.exports = router;
