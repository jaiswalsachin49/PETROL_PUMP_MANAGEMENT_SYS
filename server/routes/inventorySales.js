const express = require('express');
const router = express.Router();
const { createInventorySale, getInventorySales } = require('../controllers/inventorySaleController');

// Middleware to simulate auth if not present (adjust based on actual auth middleware)
// const { protect } = require('../middlewares/authMiddleware'); 

router.route('/')
    .get(getInventorySales)
    .post(createInventorySale);

module.exports = router;
