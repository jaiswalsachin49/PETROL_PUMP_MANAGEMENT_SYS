const Shift = require('../models/Shift')

// @desc    Get all shifts
// route    GET /api/shifts
// access   Private
const getShifts = async(req,res)=>{
    try{
        const shifts = await Shift.find().populate('assignedEmployees').populate('supervisorId')
        res.json({
            success: true,
            count: shifts.length,
            data: shifts
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Get single shift
// route    GET /api/shifts/:id
// access   Private
const getShift = async(req,res)=>{
    try{
        const shift = await Shift.findById(req.params.id).populate('assignedEmployees').populate('supervisorId')
        if(!shift){
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            })
        }
        res.json({
            success: true,
            data: shift
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// @desc    Create Shift
// route    POST /api/shifts
// access   Private
const createShift = async(req,res)=>{
    try{
        const shift = new Shift(req.body);
        await shift.save();
        res.status(201).json({
            success: true,
            data: shift
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Update Shift
// route    PUT /api/shifts/:id
// access   Private
const updateShift = async(req,res)=>{
    try{
        const shift = await Shift.findById(req.params.id)
        if(!shift){
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            })
        }
        for(const key in req.body){
            shift[key] = req.body[key]
        }
        await shift.save()
        res.json({
            success: true,
            data: shift
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Delete Shift
// route    DELETE /api/shifts/:id
// access   Private
const deleteShift = async(req,res)=>{
    try{
        const shift = await Shift.findById(req.params.id)
        if(!shift){
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            })
        }
        await shift.deleteOne()
        res.json({
            success: true,
            message: 'Shift deleted successfully'
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports ={
    getShifts,
    getShift,
    createShift,
    updateShift,
    deleteShift
}