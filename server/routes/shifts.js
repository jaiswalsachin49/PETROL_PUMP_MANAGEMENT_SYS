const express = require('express')
const {protect,authorize} = require('../middlewares/auth')
const {
    getShifts,
    getShift,
    updateShift,
    deleteShift,
    createShift,
    } = require('../controllers/shiftController')

const router = express.Router()

router.route('/')
    .get(protect, getShifts)
    .post(protect, authorize('admin','manager'), createShift)

router.route('/:id')
    .get(protect, getShift)
    .put(protect, authorize('admin','manager'), updateShift)
    .delete(protect, authorize('admin'), deleteShift)

module.exports = router