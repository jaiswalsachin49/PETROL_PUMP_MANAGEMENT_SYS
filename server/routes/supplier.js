const express = require('express');
const {protect,authorize} = require('../middlewares/auth');
const {
    getSupplier,
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');

const router = express.Router();

router.route('/')
    .get(protect, getSuppliers)
    .post(protect, authorize('admin','manager'), createSupplier);

router.route('/:id')
    .get(protect, getSupplier)
    .put(protect, authorize('admin','manager'), updateSupplier)
    .delete(protect, authorize('admin'), deleteSupplier);

module.exports = router;