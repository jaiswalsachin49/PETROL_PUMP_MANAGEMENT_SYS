const express = require('express');
const {protect, authorize} = require('../middlewares/auth');
const {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    insertMany
} = require('../controllers/customerController');

const router = express.Router();

router.route('/')
    .get(protect, getCustomers)
    .post(protect, authorize('admin', 'manager'), createCustomer);
    
router.route('/insertmany')
    .post(protect,insertMany)

router.route('/:id')
    .get(protect, getCustomer)
    .put(protect, authorize('admin', 'manager'), updateCustomer)
    .delete(protect, authorize('admin'), deleteCustomer);

module.exports = router;
