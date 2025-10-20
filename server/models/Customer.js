const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    customerId:{
        type: String,
        required: [true, 'Customer ID is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    name:{
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    companyName:{
        type: String,
        trim: true
    },
    email:{
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
    },
    phone:{
        type: String,
        trim: true,
        required: [true, 'Phone number is required']
    },
    address:{
        street: String,
        city: String,
        state: String,
        zipCode: String,
    },
    creditLimit:{
        type: Number,
        min: [0, 'Credit limit must be a positive number'],
        default: 0
    },
    outstandingBalance:{
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
customerSchema.index({ customerType: 1 });

module.exports = mongoose.model('Customer', customerSchema);