const Organization = require('../models/Organization');
const User = require('../models/User');

// @desc    Get current organization details
// @route   GET /api/organization
// @access  Private
const getOrganization = async (req, res) => {
    try {
        // Check if user has an organization
        if (!req.user.organizationId) {
            return res.status(200).json({
                success: true,
                data: null,
                message: 'No organization associated with this user. Please contact support or create a new account.'
            });
        }

        const organization = await Organization.findById(req.user.organizationId);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        res.json({
            success: true,
            data: organization
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update organization details
// @route   PUT /api/organization
// @access  Private (Admin only)
const updateOrganization = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can update organization details'
            });
        }

        const { name, gstNumber, licenseNumber, contactNumber, address, systemPreferences, notificationSettings } = req.body;

        const organization = await Organization.findByIdAndUpdate(
            req.user.organizationId,
            {
                name,
                gstNumber,
                licenseNumber,
                contactNumber,
                address,
                systemPreferences,
                notificationSettings
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: organization
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update fuel prices
// @route   PUT /api/organization/fuel-prices
// @access  Private (Admin/Manager)
const updateFuelPrices = async (req, res) => {
    try {
        if (!['admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Only administrators and managers can update fuel prices'
            });
        }

        const { petrol, diesel, premium } = req.body;

        const organization = await Organization.findByIdAndUpdate(
            req.user.organizationId,
            {
                'fuelPricing.petrol': petrol,
                'fuelPricing.diesel': diesel,
                'fuelPricing.premium': premium,
                'fuelPricing.lastUpdated': new Date()
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: organization,
            message: 'Fuel prices updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getOrganization,
    updateOrganization,
    updateFuelPrices
};
