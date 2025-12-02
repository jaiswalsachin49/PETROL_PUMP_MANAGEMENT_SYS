const express = require('express');
const { protect } = require('../middlewares/auth');
const {
    getOrganization,
    updateOrganization,
    updateFuelPrices
} = require('../controllers/organizationController');

const router = express.Router();

router.get('/', protect, getOrganization);
router.put('/', protect, updateOrganization);
router.put('/fuel-prices', protect, updateFuelPrices);

module.exports = router;
