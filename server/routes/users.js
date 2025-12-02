const express = require('express');
const { protect } = require('../middlewares/auth');
const {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
    changePassword
} = require('../controllers/userController');

const router = express.Router();

router.get('/', protect, getUsers);
router.post('/', protect, createUser);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, deleteUser);

module.exports = router;
