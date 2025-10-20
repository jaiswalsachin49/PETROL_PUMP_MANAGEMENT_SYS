const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const tankSchema = new mongoose.Schema({
    tankNumber:{
        type: String,
        required: [true, 'Tank number is required'],
        unique: true,
        trim: true
    },
    fuelType:{
        type: String,
        required: [true, 'Fuel type is required'],
        enum: ['Petrol', 'Diesel', 'CNG']
    },
    capacity:{
        type: Number,
        required: [true, 'Capacity is required'],
        min: [0, 'Capacity must be a positive number']
    },
    currentLevel:{
        type: Number,
        default: 0
    },
    minimumLevel:{
        type: Number,
        required: [true, 'Minimum level is required'],
    },
    status:{
        type: String,
        enum: ['Active', 'Inactive', 'Under Maintenance'],
        default: 'Active'
    },
    lastDipReading:{
        reading: Number,
        date: Date,
        recordedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }
        },
    },{
    timestamps: true
})

//INDEX TO OPTIMIZE QUERIES BASED ON TANK NUMBER AND FUEL TYPE
tankSchema.index({ tankNumber: 1, fuelType: 1 });

module.exports = mongoose.model('Tank',tankSchema);