const express = require('express')
const { protect, authorize } = require('../middlewares/auth')
const {
    getShifts,
    getShift,
    updateShift,
    deleteShift,
    createShift,
    closeShift,
    getShiftSummary
} = require('../controllers/shiftController')

const router = express.Router()

router.route('/')
    .get(protect, getShifts)
    .post(protect, authorize('admin', 'manager'), createShift)

router.route('/:id')
    .get(protect, getShift)
    .put(protect, authorize('admin', 'manager'), updateShift)
    .delete(protect, authorize('admin'), deleteShift)


router.route('/:id/summary')
    .get(protect, getShiftSummary)

router.route('/:id/close')
    .post(protect, closeShift)
module.exports = router