const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    shiftNumber: {
        type: Number,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
    },
    assignedEmployees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    }],
    openingCash: {
        type: Number,
        default: 0,
    },
    closingCash: {
        type: Number,
        default: 0,
    },
    totalSales: {
        type: Number,
        default: 0,
    },
    cashCollected: {
        type: Number,
        default: 0,
    },
    cardPayments: {
        type: Number,
        default: 0,
    },
    upiPayments: {
        type: Number,
        default: 0,
    },
    tankReadings: [{
        tankId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tank',
        },
        openingReading: Number,
        closingReading: Number,
    }],
    pumpReadings: [{
        pumpId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pump',
        },
        nozzleId: String,
        openingReading: Number,
        closingReading: Number,
    }],
    discrepancies: [{
        type: {
            type: String,
            enum: ['cash', 'fuel', 'reading'],
        },
        amount: Number,
        reason: String,
    }],
    status: {
        type: String,
        enum: ['active', 'closed', 'reconciled'],
        default: 'active',
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    },
    notes: {
        type: String,
        trim: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization'
    },
}, {
    timestamps: true,
});

// Indexes
shiftSchema.index({ date: -1 });
shiftSchema.index({ status: 1 });
shiftSchema.index({ shiftNumber: 1, date: 1 });

shiftSchema.pre('save', async function (next) {
    if (!this.shiftNumber) {
        const startOfDay = new Date(this.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(this.date);
        endOfDay.setHours(23, 59, 59, 999);

        const shiftCount = await mongoose.model('Shift').countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        this.shiftNumber = shiftCount + 1;
    }
    next();
});

module.exports = mongoose.model('Shift', shiftSchema);
