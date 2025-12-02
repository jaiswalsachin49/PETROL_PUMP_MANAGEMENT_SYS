const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
    type: {
        type: String,
        enum: ['sale', 'purchase', 'expense', 'payment_received', 'payment_made'],
        required: [true, 'Transaction type is required'],
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'cheque', 'bank_transfer'],
        required: true,
    },
    referenceId: {
        type: String,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        trim: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
}, {
    timestamps: true,
});

// Auto-generate transactionId
transactionSchema.pre('save', async function (next) {
    if (!this.transactionId) {
        const count = await mongoose.model('Transaction').countDocuments();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.transactionId = `TXN${dateStr}${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Indexes
transactionSchema.index({ date: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
