const express = require('express');
const { register, login, getMe, updateProfile, changePassword, } = require('../controllers/authController');

const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;