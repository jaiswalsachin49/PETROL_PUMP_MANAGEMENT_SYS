const express = require('express')
const {protect,authorize} = require('../middlewares/auth')
const {
    getPurchase,
    getPurchases,
    createPurchase,
    updatePurchase,
    deletePurchase
} = require('../controllers/purchaseController')

const router = express.Router()

router.route('/')
    .get(protect, getPurchases)
    .post(protect, authorize('admin','manager'), createPurchase)

router.route('/:id')
    .get(protect, getPurchase)
    .put(protect, authorize('admin','manager'), updatePurchase)
    .delete(protect, authorize('admin'), deletePurchase)

module.exports = router