const Employee = require('../models/Employee');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json({
            success: true,
            count: employees.length,
            data: employees
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            })
        }
        res.json({
            success: true,
            data: employee
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private
const createEmployee = async (req, res) => {
    try {
        const employee = await Employee.create(req.body);
        res.status(201).json({
            success: true,
            data: employee
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}

// @desc   Update employee
// @route  PUT /api/employees/:id
// @access Private
const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        await employee.deleteOne();
        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee
};