const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all users in current organization
// @route   GET /api/users
// @access  Private (Admin/Manager)
const getUsers = async (req, res) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const users = await User.find({
            organizationId: req.user.organizationId,
            isActive: true
        })
            .select('-password')
            .populate('createdBy', 'name username')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin can create manager/accountant, Manager can create manager/accountant)
const createUser = async (req, res) => {
    try {
        const { username, email, password, role, name, phone, address } = req.body;

        // Role-based validation
        if (req.user.role === 'admin') {
            // Admin can create manager or accountant
            if (!['manager', 'accountant'].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin can only create manager or accountant accounts'
                });
            }
        } else if (req.user.role === 'manager') {
            // Manager can create manager or accountant
            if (!['manager', 'accountant'].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Manager can only create manager or accountant accounts'
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create new user
        const user = await User.create({
            username,
            email,
            password,
            role,
            name,
            phone,
            address,
            organizationId: req.user.organizationId,
            createdBy: req.user._id
        });

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            data: userResponse,
            message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/Manager)
const updateUser = async (req, res) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { name, phone, address, isActive } = req.body;

        const user = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId
            },
            { name, phone, address, isActive },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete users'
            });
        }

        const user = await User.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId
            },
            { isActive: false },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, address },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            data: user,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Change own password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
    changePassword
};
