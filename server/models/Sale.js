const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    saleId: {
        type: String,
        unique: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
    },
    pumpId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pump',
        required: [true, 'Pump reference is required'],
    },
    nozzleId: {
        type: String,
        required: [true, 'Nozzle ID is required'],
    },
    fuelType: {
        type: String,
        enum: ['petrol', 'diesel', 'cng'],
        required: [true, 'Fuel type is required'],
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
    },
    pricePerLiter: {
        type: Number,
        required: [true, 'Price per liter is required'],
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    saleType: {
        type: String,
        enum: ['cash', 'credit', 'card', 'upi', 'fleet'],
        required: [true, 'Sale type is required'],
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
    },
    vehicleNumber: {
        type: String,
        uppercase: true,
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee reference is required'],
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'overdue'],
        default: 'paid',
    },
    invoiceNumber: {
        type: String,
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});

// Auto-generate saleId and calculate totalAmount
saleSchema.pre('save', async function (next) {
    if (!this.saleId) {
        const count = await mongoose.model('Sale').countDocuments();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.saleId = `SALE${dateStr}${String(count + 1).padStart(4, '0')}`;
    }

    // Calculate total amount
    this.totalAmount = this.quantity * this.pricePerLiter;

    next();
});

// Indexes
saleSchema.index({ date: -1 });
saleSchema.index({ saleId: 1 });
saleSchema.index({ customerId: 1 });
saleSchema.index({ saleType: 1 });
saleSchema.index({ paymentStatus: 1 });
saleSchema.index({ shiftId: 1 });

module.exports = mongoose.model('Sale', saleSchema);
