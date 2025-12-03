const Pump = require('../models/Pump');
const Sale = require('../models/Sale')
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');

// @desc    Get all pumps
// @route   GET /api/pumps
// @access  Private
const getPumps = async (req, res) => {
    try {
        const filter = req.user.organizationId ? { organizationId: req.user.organizationId } : {};
        const pumps = await Pump.find(filter).populate('tankId', 'tankNumber fuelType').populate('nozzles.assignedEmployee', 'name position')
        res.json({
            success: true,
            count: pumps.length,
            data: pumps
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Get single pump
// @route   GET /api/pumps/:id
// @access  Private
const getPump = async (req, res) => {
    try {
        const pump = await Pump.findById(req.params.id).populate('tankId').populate('nozzles.assignedEmployee')
        if (!pump) {
            return res.status(404).json({
                success: false,
                message: 'Pump not found'
            })
        }
        res.json({
            success: true,
            data: pump
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// @desc    Create new pump
// @route   POST /api/pumps
// @access  Private (Admin/Manager)
const createPump = async (req, res) => {
    try {
        if (!req.body.tankId || !req.body.pumpNumber) {
            return res.status(400).json({ success: false, message: 'tankId and pumpNumber are required' });
        }
        const pump = await Pump.create({
            ...req.body,
            organizationId: req.user.organizationId
        })
        res.status(201).json({
            success: true,
            data: pump
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Update pump info
// @route   PUT /api/pumps/:id
// @access  Private (Admin/Manager)
const updatePump = async (req, res) => {
    try {
        let pump = await Pump.findById(req.params.id)
        if (!pump) {
            return res.status(404).json({
                success: false,
                message: 'Pump not found'
            })
        }
        pump = await Pump.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        })
        res.json({
            success: true,
            data: pump
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Delete pump
// @route   DELETE /api/pumps/:id
// @access  Private (Admin)
const deletePump = async (req, res) => {
    try {
        const pump = await Pump.findById(req.params.id)
        if (!pump) {
            return res.status(404).json({
                success: false,
                message: 'Pump not found'
            })
        }
        await pump.deleteOne()
        res.json({
            success: true,
            message: 'Pump removed successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Add nozzle to a pump
// @route   POST /api/pumps/:id/nozzles
// @access  Private (Admin/Manager)
const addNozzle = async (req, res) => {
    try {
        const { nozzleId, assignedEmployee, fueltype } = req.body
        const pump = await Pump.findById(req.params.id)
        if (!pump) {
            return res.status(404).json({
                success: false,
                message: 'Pump not found'
            })
        }
        pump.nozzles.push({
            nozzleId,
            assignedEmployee,
            fueltype
        })
        await pump.save()
        res.status(201).json({
            success: true,
            data: pump
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

// @desc    Update nozzle reading
// @route   PUT /api/pumps/:id/nozzles/:nozzleId
// @access  Private
const updateNozzleReading = async (req, res) => {
    try {
        const { openingReading, closingReading, currentReading } = req.body;
        const pump = await Pump.findById(req.params.id);
        if (!pump) return res.status(404).json({ success: false, message: 'Pump not found' });
        const nozzle = pump.nozzles.id(req.params.nozzleId);
        if (!nozzle) return res.status(404).json({ success: false, message: 'Nozzle not found' });
        if (openingReading !== undefined) nozzle.openingReading = openingReading;
        if (closingReading !== undefined) nozzle.closingReading = closingReading;
        if (currentReading !== undefined) nozzle.currentReading = currentReading;

        await pump.save();
        res.json({ success: true, data: pump });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Assign/Unassign employee to nozzle
// @route   PUT /api/pumps/:id/nozzles/:nozzleId/assign
// @access  Private (Manager)
const assignNozzleEmployee = async (req, res) => {
    try {
        const { assignedEmployee } = req.body;
        const pump = await Pump.findById(req.params.id);
        if (!pump) return res.status(404).json({ success: false, message: 'Pump not found' });

        const nozzle = pump.nozzles.id(req.params.nozzleId);
        if (!nozzle) return res.status(404).json({ success: false, message: 'Nozzle not found' });

        nozzle.assignedEmployee = assignedEmployee || null;
        await pump.save();

        // Auto-mark attendance if assigning an employee
        if (assignedEmployee) {
            const activeShift = await Shift.findOne({ status: 'active' });
            if (activeShift) {
                const employee = await Employee.findById(assignedEmployee);
                if (employee) {
                    const existingAttendance = employee.attendance.find(
                        att => att.shiftId && att.shiftId.toString() === activeShift._id.toString()
                    );

                    if (!existingAttendance) {
                        employee.attendance.push({
                            date: new Date(),
                            shiftId: activeShift._id,
                            status: 'present',
                            notes: 'Auto-marked upon nozzle assignment'
                        });
                        await employee.save();
                    }
                }
            }
        }

        res.json({ success: true, data: pump });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};


// @desc    Get pumps by tank ID
// @route   GET /api/pumps/tank/:tankId
// @access  Private
const getPumpsByTank = async (req, res) => {
    try {
        const pumps = await Pump.find({ tankId: req.params.tankId });
        res.json({ success: true, count: pumps.length, data: pumps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Get all active/maintenance pumps
// @route   GET /api/pumps/status/:state
// @access  Private
const getPumpsByStatus = async (req, res) => {
    try {
        const state = req.params.state;
        const pumps = await Pump.find({ status: state });
        res.json({ success: true, count: pumps.length, data: pumps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @desc    Get pumps with today's sales aggregated
// @route   GET /api/pumps/with-sales
// @access  Private
const getPumpsWithSales = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const pumps = await Pump.find().populate('tankId', 'tankNumber fuelType').lean();

        const pumpSales = await Sale.aggregate([
            { $match: { date: { $gte: today, $lt: tomorrow } } },
            {
                $group: {
                    _id: '$pumpId',
                    todaySales: { $sum: '$totalAmount' },
                    todaySalesQty: { $sum: '$quantity' }
                }
            }
        ]);

        const salesMap = {};
        pumpSales.forEach(s => {
            salesMap[s._id.toString()] = {
                amount: s.todaySales,
                quantity: s.todaySalesQty
            };
        });

        const response = pumps.map(pump => {
            const sales = salesMap[pump._id.toString()] || { amount: 0, quantity: 0 };
            return {
                id: pump._id,
                name: pump.pumpNumber,
                type: pump.tankId?.fuelType || 'Unknown',
                tank: `Tank ${pump.tankId?.tankNumber || 'N/A'}`,
                status: pump.status === 'active' ? 'Active' : 'Maintenance',
                todaySalesAmount: sales.amount,
                todaySalesQuantity: sales.quantity,
                color: pump.status === 'active' ? 'emerald' : 'orange'
            };
        });

        res.json({ success: true, data: response });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



module.exports = {
    getPumps,
    getPump,
    createPump,
    updatePump,
    deletePump,
    addNozzle,
    updateNozzleReading,
    assignNozzleEmployee,
    getPumpsByTank,
    getPumpsByStatus,
    getPumpsWithSales
};