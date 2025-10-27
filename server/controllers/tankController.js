const Tank = require('../models/Tank');
const Purchase = require('../models/Purchase')

// @desc    Get all tanks
// @route   GET /api/tanks
// @access  Private
const getTanks = async (req, res) => {
    try {
        const tanks = await Tank.find().populate('lastDipReading.recordedBy', 'username')
        res.json({
            success: true,
            count: tanks.length,
            data: tanks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc Get tank by ID
// @route GET /api/tanks/:id
// @access Private
const getTank = async (req, res) => {
    try {
        const tank = await Tank.findById(req.params.id)
        if (!tank) {
            return res.status(404).json({
                success: false,
                message: 'Tank not found',
            });
        }
        res.json({
            success: true,
            data: tank,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Create new tank
// @route   POST /api/tanks
// @access  Private
const createTank = async (req, res) => {
    try {
        const tank = await Tank.create(req.body);
        res.status(201).json({
            success: true,
            data: tank,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desk   Update tank
// @route  PUT /api/tanks/:id
// @access Private
const updatedTank = async (req, res) => {
    try {
        const tank = await Tank.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        )
        if (!tank) {
            return res.status(404).json({
                success: false,
                message: 'Tank not found',
            });
        }
        res.json({
            success: true,
            data: tank,
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Delete tank
// @route   DELETE /api/tanks/:id
// @access  Private
const deleteTank = async (req, res) => {
    try {
        const tank = await Tank.findByIdAndDelete(req.params.id)
        if (!tank) {
            return res.status(404).json({
                success: false,
                message: 'Tank not found',
            });
        }
        await tank.deleteOne();
        res.json({
            success: true,
            message: 'Tank deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Update tank dip reading
// @route   PUT /api/tanks/:id/dip
// @access  Private
const updateDipReading = async (req, res) => {
    try {
        const { reading } = req.body
        const tank = await Tank.findById(req.params.id)
        if (!tank) {
            return res.status(404).json({
                success: false,
                message: 'Tank not found'
            })
        }
        
        tank.currentLevel = reading;

        tank.lastDipReading = {
            reading,
            recordedBy: req.user._id,
            date: Date.now(),
            recordedAt: Date.now(),
        }

        await tank.save()
        res.json({
            success: true,
            data: tank,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Get low fuel tanks
// @route   GET /api/tanks/low-fuel
// @access  Private
const getLowFuelTanks = async (req, res) => {
    try {
        const tanks = await Tank.find({
            $expr: { $lte: ['$currentLevel', '$minimumLevel'] },
            status: 'active'
        })
        res.json({
            success: true,
            count: tanks.length,
            data: tanks
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// @desc    Get tank with full details including supplier and last refill
// @route   GET /api/tanks/:id/details
// @access  Private
const getTankDetails = async (req, res) => {
    try {
        const tank = await Tank.findById(req.params.id).lean()
        if (!tank) {
            return res.status(404).json({
                success: false,
                message: "Tank not found"
            })
        }

        const lastRefill = await Purchase.findOne({ 'items.itemName': { $regex: tank.fuelType, $options: 'i' } }).sort({ date: -1 }).populate('supplierId', 'name').lean()

        const response = {
            id: tank._id,
            name: `${tank.fuelType} Tank ${tank.tankNumber}`,
            type: tank.fuelType,
            current: tank.currentLevel,
            capacity: tank.capacity,
            percentage: Math.round((tank.currentLevel / tank.capacity) * 100),
            status: tank.currentLevel <= tank.minimumLevel ? 'Critical' :
                tank.currentLevel <= tank.minimumLevel * 1.5 ? 'Low' : 'Good',
            lastRefill: lastRefill ? new Date(lastRefill.date).toLocaleDateString('en-IN') : 'N/A',
            supplier: lastRefill?.supplierId?.name || 'N/A',
            gradient: tank.fuelType === 'Petrol' ? 'from-blue-500 to-cyan-500' :
                tank.fuelType === 'Diesel' ? 'from-orange-500 to-red-500' :
                    'from-purple-500 to-pink-500'
        };

        res.json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


module.exports = {
    getTanks,
    getTank,
    createTank,
    updatedTank,
    deleteTank,
    updateDipReading,
    getLowFuelTanks,
    getTankDetails
}