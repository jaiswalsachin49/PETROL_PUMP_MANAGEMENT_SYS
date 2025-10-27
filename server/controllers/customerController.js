const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async(req,res)=>{
    try{
        const customers =  await Customer.find();
        res.json({
            success: true,
            count: customers.length,
            data: customers
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async(req,res)=>{
    try{
        const customer =  await Customer.findById(req.params.id);
        if(!customer){
            return  res.status(404).json({
                success: false,
                message: 'Customer not found'
            })
        }
        res.json({
            success: true,
            data: customer
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async(req,res)=>{
    try{
        const customer = await Customer.create(req.body);
        res.status(201).json({
            success: true,
            data: customer
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Update customer info
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async(req,res)=>{
    try{
        const customer = await Customer.findByIdAndUpdate(req.params.id,req.body,{ new:true,runValidators:true });
        if(!customer){
            return  res.status(404).json({
                success: false,
                message: 'Customer not found'
            })
        }
        res.json({
            success: true,
            data: customer
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async(req,res)=>{
    try{
        const customer = await Customer.findById(req.params.id);
        if(!customer){
            return  res.status(404).json({
                success: false,
                message: 'Customer not found'
            })
        }
        await customer.deleteOne();
        res.json({
            success: true,
            message: 'Customer removed successfully'
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

const insertMany = async(req,res)=>{
    try{
        const data = await Customer.insertMany(req.body)
        res.status(201).json({
            success: true,
            data: {data}
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports = {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    insertMany
}