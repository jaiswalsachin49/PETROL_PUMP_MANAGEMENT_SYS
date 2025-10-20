const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    itemId: {
        type: String,
        unique: true,
        uppercase: true,
    },
    itemName: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
    },
    category: {
        type: String,
        enum: ['lubricant', 'accessory', 'spare_part', 'consumable'],
        required: [true, 'Category is required'],
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        enum: ['liter', 'piece', 'kg', 'box', 'packet'],
    },
    costPrice: {
        type: Number,
        required: [true, 'Cost price is required'],
        min: 0,
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: 0,
    },
    reorderLevel: {
        type: Number,
        required: [true, 'Reorder level is required'],
        min: 0,
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
    },
    location: {
        type: String,
        trim: true,
    },
    lastRestockDate: {
        type: Date,
    },
    expiryDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Auto-generate itemId
inventorySchema.pre('save', async function (next) {
    if (!this.itemId) {
        const count = await mongoose.model('Inventory').countDocuments();
        this.itemId = `INV${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Virtual to check if reorder is needed
inventorySchema.virtual('needsReorder').get(function () {
    return this.quantity <= this.reorderLevel;
});

// Indexes
inventorySchema.index({ itemId: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ quantity: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);
