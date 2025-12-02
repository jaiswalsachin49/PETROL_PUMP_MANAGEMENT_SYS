const User = require('../models/User');
const Organization = require('../models/Organization');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

//GENERATE JWT TOKEN
const generateToken = (id) => {
    // console.log("JWT_SECRET:", JSON.stringify(process.env.JWT_SECRET));
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    })
}

// @desc    Register new user with organization
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            role,
            name,
            phone,
            // Organization details
            organizationName,
            gstNumber,
            licenseNumber,
            contactNumber,
            address
        } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email or username',
            });
        }

        // Create organization first (only for admin signup)
        let organizationId;
        if (role === 'admin' || !role) {
            const organization = await Organization.create({
                name: organizationName || 'Petrol Pump',
                gstNumber,
                licenseNumber,
                contactNumber: contactNumber || phone,
                address: address || 'Not Provided'
            });
            organizationId = organization._id;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Only admin can register new organizations'
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role: 'admin', // First user is always admin
            name,
            phone,
            organizationId
        });

        // Update organization with createdBy
        await Organization.findByIdAndUpdate(organizationId, { createdBy: user._id });

        if (user) {
            res.status(201).json({
                success: true,
                data: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    organizationId: user.organizationId,
                    token: generateToken(user._id),
                },
                message: 'Organization and admin account created successfully'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).populate('organizationId');

        if (user && (await user.matchPassword(password))) {
            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact your administrator.',
                });
            }

            const token = generateToken(user._id);
            res.json({
                success: true,
                data: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organizationId?._id,
                    organization: user.organizationId,
                    token: token
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('employeeId');
        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { username, email, phone } = req.body;

        const user = await User.findById(req.user.id);

        if (user) {
            user.username = username || user.username;
            user.email = email || user.email;
            user.phone = phone || user.phone;

            const updatedUser = await user.save();

            res.json({
                success: true,
                data: updatedUser,
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
};