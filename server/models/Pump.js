const mongoose = require('mongoose');

const nozzleSchema = new mongoose.Schema({
    nozzleId: {
        type: String,
        required: [true, 'Nozzle ID is required'],
    },
    fueltype: {
        type: String,
        required: [true, 'Fuel type is required'],
        enum: ['petrol', 'diesel', 'cng']
    },
    openingReading: {
        type: Number,
        min: 0
    },
    closingReading: {
        type: Number,
        min: 0
    },
    currentReading: {
        type: Number,
        min: 0
    },
    assignedEmployee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }
}, { _id: true });

const pumpSchema = new mongoose.Schema({
    pumpNumber:{
        type: String,
        required: [true, 'Pump number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    tankId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tank',
        required: [true, 'Associated tank is required']
    },
    nozzles:[nozzleSchema],
    status:{
        type: String,
        enum: ['active', 'under-maintainance'],
        default: 'active'
    },
    lastCalibrationDate:{
        type: Date,
    },
    locationDescription:{
        type: String,
        trim: true
    }
},{
    timestamps: true
})

pumpSchema.index({ pumpNumber: 1 });
pumpSchema.index({ tankId: 1 });
pumpSchema.index({ status: 1 });

module.exports = mongoose.model('Pump',pumpSchema);