const Supplier = require('../models/Supplier');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async(req, res) => {
    try{
        const suppliers = await Supplier.find();
        res.status(200).json({
            success: true,
            count: suppliers.length,
            data: suppliers
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Get single supplier
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplier = async(req,res)=>{
    try{
        const supplier = await Supplier.findById(req.params.id);
        if(!supplier){
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            })
        }
        res.status(200).json({
            success: true,
            data: supplier
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = async(req,res)=>{
    try{
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json({
            success: true,
            data: supplier
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}   

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = async(req,res)=>{
    try{
        let supplier = await Supplier.findById(req.params.id);
        if(!supplier){
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            })
        }
        supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.status(200).json({
            success: true,
            data: supplier
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private
const deleteSupplier = async(req,res)=>{
    try{
        const supplier = await Supplier.findById(req.params.id);
        if(!supplier){
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            })
        }
        await supplier.deleteOne();
        res.status(200).json({
            success: true,
            message: 'Supplier removed'
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports = {
    getSuppliers,
    getSupplier,
    createSupplier,
    updateSupplier,
    deleteSupplier
}