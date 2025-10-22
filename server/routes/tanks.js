const express = require('express');
const { getTanks, getTank, createTank, updatedTank, deleteTank, updateDipReading, getLowFuelTanks, getTankDetails } = require('../controllers/tankController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/alerts/low-fuel').get(protect, getLowFuelTanks);


router.route('/')
    .get(protect, getTanks)
    .post(protect, authorize('admin', 'manager'), createTank);

router.route('/:id')
    .get(protect, getTank)
    .put(protect, authorize('admin', 'manager'), updatedTank)
    .delete(protect, authorize('admin'), deleteTank);

router.route('/:id/dip-reading')
    .put(protect, updateDipReading)

router.route('/:id/details') 
    .get(protect, getTankDetails)

module.exports = router;