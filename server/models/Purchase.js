const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    purchaseId: {
        type: String,
        unique: true,
    },
    supplier: {
        type: String,
        required: false,
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Supplier reference is required'],
    },
    items: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
        },
        tankId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tank',
        },
        itemName: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        totalPrice: Number,
    }],
    totalAmount: {
        type: Number,
        min: 0,
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'partial', 'pending'],
        default: 'pending',
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'cheque', 'bank_transfer', 'credit'],
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
    deliveryDate: {
        type: Date,
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});

// Auto-generate purchaseId and calculate totals
purchaseSchema.pre('save', async function (next) {
    if (!this.purchaseId) {
        const count = await mongoose.model('Purchase').countDocuments();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.purchaseId = `PUR${dateStr}${String(count + 1).padStart(4, '0')}`;
    }

    // Calculate item totals and overall total
    let total = 0;
    this.items.forEach(item => {
        item.totalPrice = item.quantity * item.unitPrice;
        total += item.totalPrice;
    });
    this.totalAmount = total;

    next();
});

// Indexes
purchaseSchema.index({ date: -1 });
purchaseSchema.index({ purchaseId: 1 });
purchaseSchema.index({ supplierId: 1 });
purchaseSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
