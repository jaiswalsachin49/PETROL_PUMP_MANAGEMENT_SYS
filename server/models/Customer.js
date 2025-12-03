const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerId: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    saleType: {
        type: String,
        enum: ['credit', 'cash', 'fleet'],
        default: 'credit'
    },
    companyName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        sparse: true, // Allow multiple null/undefined values
    },
    phone: {
        type: String,
        trim: true,
        required: [true, 'Phone number is required']
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
    },
    creditLimit: {
        type: Number,
        min: [0, 'Credit limit must be a positive number'],
        default: 0
    },
    outstandingBalance: {
        type: Number,
        min: [0, 'Outstanding balance must be a positive number'],
        default: 0
    },
    vehicles: [{
        vehicleNumber: {
            type: String,
            uppercase: true,
        },
        vehicleType: String,
    }],
    paymentTerms: {
        type: String,
        default: 'immediate',
    },
    gstNumber: {
        type: String,
        uppercase: true,
    },
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
        // Optional for backward compatibility
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

customerSchema.index({ customerId: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });


customerSchema.pre('save', async function (next) {
    if (!this.customerId) {
        const listCus = await mongoose.model('Customer').findOne().sort({ createdAt: -1 });

        let nextNumber = 1;
        if (listCus && listCus.customerId) {
            const lastNum = parseInt(listCus.customerId.replace('CUS', ''), 10);
            if (!isNaN(lastNum)) nextNumber = lastNum + 1;
        }

        this.customerId = `CUS${String(nextNumber).padStart(5, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Customer', customerSchema);