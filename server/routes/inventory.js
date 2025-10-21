const express = require('express')
const {protect,authorize} = require('../middlewares/auth')
const {
    getInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    } = require('../controllers/inventoryController')

const router = express.Router()

router.route('/')
    .get(protect, getInventoryItems)
    .post(protect, authorize('admin','manager'), createInventoryItem)

router.route('/:id')
    .get(protect, getInventoryItem)
    .put(protect, authorize('admin','manager'), updateInventoryItem)
    .delete(protect, authorize('admin'), deleteInventoryItem)

module.exports = router