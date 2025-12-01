const mongoose = require('mongoose');

const inventorySaleSchema = new mongoose.Schema({
    saleId: {
        type: String,
        unique: true,
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true,
    },
    itemName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    sellingPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'credit'],
        default: 'cash',
    },
    soldBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    notes: String,
}, {
    timestamps: true,
});

inventorySaleSchema.pre('save', async function (next) {
    if (!this.saleId) {
        const count = await mongoose.model('InventorySale').countDocuments();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        this.saleId = `INV-SALE-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

module.exports = mongoose.model('InventorySale', inventorySaleSchema);
