const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employeeId:{
        type: String,
        required: [true, 'Employee ID is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    name:{
        type: String,
        required: [true, 'Employee name is required'],
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
    position:{
        type: String,
        enum: ['pump_attendant','manager','accountant'],
        required: [true, 'Position is required']
    },
    salary:{
        type: Number,
        min: [0, 'Salary must be a positive number'],
    },
    joiningDate:{
        type: Date,
        default: Date.now
    },
    address:{
        street: String,
        city: String,
        state: String,
        zipCode: String,
    },
    emergencyContact:{
        name: String,
        phone: String,
        relationship: String
    },
    documents:[{
        type:{
            type: String,
            enum: ['ADHAAR','DRIVING LICENSE','PAN'],
            required: [true, 'Document type is required']
        },
        documentNumber: String,
        issueDate: Date,
        expiryDate: Date,
    }],
    attendance:[{
        date: { type: Date, default: Date.now },
        shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
        status: { type: String, enum: ['Present','Absent','Leave','Holiday']},
        hoursWorked: Number
    }],
    isActive:{
        type: Boolean,
        default: true
    }
},{
    timestamps: true
})

employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ position: 1 });
employeeSchema.index({ isActive: 1 });
module.exports = mongoose.model('Employee',employeeSchema);