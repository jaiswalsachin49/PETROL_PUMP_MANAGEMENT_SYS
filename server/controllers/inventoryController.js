const Inventory = require('../models/Inventory');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
const getInventoryItems = async(req,res)=>{
    try{
        const items = await Inventory.find()
        res.json({
            success: true,
            count: items.length,
            data: items
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private
const getInventoryItem = async(req,res)=>{
    try{
        const item = await Inventory.findById(req.params.id)
        if(!item){
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            })
        }
        res.json({
            success: true,
            data: item
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })   
    }
}

// @desc    Create new inventory item
// @route   POST /api/inventory
// @access  Private
const createInventoryItem = async(req,res)=>{
    try{
        const item = new Inventory(req.body);
        await item.save();
        res.status(201).json({
            success: true,
            data: item
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private
const updateInventoryItem = async(req,res)=>{
    try{
        const item = await Inventory.findById(req.params.id)
        if(!item){
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            })
        }
        for(const key in req.body){
            item[key] = req.body[key]
        }
        await item.save()
        res.json({
            success: true,
            data: item
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private
const deleteInventoryItem = async(req,res)=>{
    try{
        const item = await Inventory.findById(req.params.id)
        if(!item){
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            })
        }
        await item.remove()
        res.json({
            success: true,
            message: 'Inventory item deleted successfully'
        })
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

module.exports = {
    getInventoryItems,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
}