const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true
    },
    gstNumber: {
        type: String,
        trim: true,
        uppercase: true
    },
    licenseNumber: {
        type: String,
        trim: true
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required']
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    fuelPricing: {
        petrol: {
            type: Number,
            default: 96,
            min: 0
        },
        diesel: {
            type: Number,
            default: 88,
            min: 0
        },
        premium: {
            type: Number,
            default: 105,
            min: 0
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    systemPreferences: {
        currency: {
            type: String,
            default: 'INR (₹)',
            enum: ['INR (₹)', 'USD ($)', 'EUR (€)']
        },
        dateFormat: {
            type: String,
            default: 'DD/MM/YYYY',
            enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
        }
    },
    notificationSettings: {
        lowStockAlerts: {
            type: Boolean,
            default: true
        },
        paymentReminders: {
            type: Boolean,
            default: true
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
organizationSchema.index({ name: 1 });
organizationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
