const Employee = require('../models/Employee');
const Shift = require('../models/Shift');

// @desc Mark employee attendance for a shift
// @route POST /api/attendance
// @access Private (Manager/Admin)
const markAttendance = async (req, res) => {
    try {
        const { employeeId, shiftId, status, notes } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }


        const shift = await Shift.findById(shiftId);
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        const existingAttendance = employee.attendance.find(
            att => att.shiftId && att.shiftId.toString() === shiftId
        );

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this shift'
            });
        }

        employee.attendance.push({
            date: shift.startTime,
            shiftId: shiftId,
            status: status || 'present',
            notes: notes || ''
        });

        await employee.save();

        res.status(201).json({
            success: true,
            data: employee.attendance[employee.attendance.length - 1],
            message: 'Attendance marked successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get attendance for specific employee
// @route GET /api/attendance/employee/:employeeId
// @access Private
const getEmployeeAttendance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { startDate, endDate, month, year } = req.query;

        const employee = await Employee.findById(employeeId)
            .populate('attendance.shiftId', 'shiftNumber startTime endTime');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        let attendance = employee.attendance;

        if (startDate && endDate) {
            attendance = attendance.filter(att => {
                const attDate = new Date(att.date);
                return attDate >= new Date(startDate) && attDate <= new Date(endDate);
            });
        }

        if (month && year) {
            attendance = attendance.filter(att => {
                const attDate = new Date(att.date);
                return attDate.getMonth() === parseInt(month) - 1 &&
                    attDate.getFullYear() === parseInt(year);
            });
        }

        const totalDays = attendance.length;
        const presentDays = attendance.filter(att => att.status === 'present').length;
        const absentDays = attendance.filter(att => att.status === 'absent').length;
        const leaveDays = attendance.filter(att => att.status === 'leave').length;
        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                employee: {
                    _id: employee._id,
                    employeeId: employee.employeeId,
                    name: employee.name,
                    position: employee.position
                },
                attendance: attendance,
                statistics: {
                    totalDays,
                    presentDays,
                    absentDays,
                    leaveDays,
                    attendancePercentage: `${attendancePercentage}%`
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get attendance for specific shift
// @route GET /api/attendance/shift/:shiftId
// @access Private
const getShiftAttendance = async (req, res) => {
    try {
        const { shiftId } = req.params;
        const shift = await Shift.findById(shiftId).populate('assignedEmployees', 'employeeId name position');

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'Shift not found'
            });
        }

        const assignedEmployeeIds = shift.assignedEmployees.map(emp => emp._id);

        const employees = await Employee.find({
            _id: { $in: assignedEmployeeIds }
        }).select('employeeId name position attendance');

        const attendanceRecords = employees.map(emp => {
            const attRecord = emp.attendance.find(
                att => att.shiftId && att.shiftId.toString() === shiftId
            );

            return {
                employeeId: emp.employeeId,
                name: emp.name,
                position: emp.position,
                status: attRecord ? attRecord.status : 'not_marked',
                notes: attRecord ? attRecord.notes : '',
                markedAt: attRecord ? attRecord.date : null
            };
        });

        const summary = {
            totalAssigned: assignedEmployeeIds.length,
            present: attendanceRecords.filter(r => r.status === 'present').length,
            absent: attendanceRecords.filter(r => r.status === 'absent').length,
            leave: attendanceRecords.filter(r => r.status === 'leave').length,
            notMarked: attendanceRecords.filter(r => r.status === 'not_marked').length
        };

        res.json({
            success: true,
            data: {
                shift: {
                    _id: shift._id,
                    shiftNumber: shift.shiftNumber,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    status: shift.status
                },
                attendance: attendanceRecords,
                summary
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Get monthly attendance summary for all employees
// @route GET /api/attendance/summary/monthly
// @access Private (Manager/Admin)
const getMonthlyAttendanceSummary = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({
                success: false,
                message: 'Month and year are required'
            });
        }

        const employees = await Employee.find({ isActive: true })
            .select('employeeId name position attendance');

        const summary = employees.map(emp => {
            const monthlyAttendance = emp.attendance.filter(att => {
                const attDate = new Date(att.date);
                return attDate.getMonth() === parseInt(month) - 1 &&
                    attDate.getFullYear() === parseInt(year);
            });

            const totalDays = monthlyAttendance.length;
            const presentDays = monthlyAttendance.filter(att => att.status === 'present').length;
            const absentDays = monthlyAttendance.filter(att => att.status === 'absent').length;
            const leaveDays = monthlyAttendance.filter(att => att.status === 'leave').length;
            const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

            return {
                employeeId: emp.employeeId,
                name: emp.name,
                position: emp.position,
                totalDays,
                presentDays,
                absentDays,
                leaveDays,
                attendancePercentage: `${attendancePercentage}%`
            };
        });

        res.json({
            success: true,
            data: {
                month: parseInt(month),
                year: parseInt(year),
                employees: summary,
                totalEmployees: employees.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Update attendance record
// @route PUT /api/attendance/:employeeId/:attendanceId
// @access Private (Manager/Admin)
const updateAttendance = async (req, res) => {
    try {
        const { employeeId, attendanceId } = req.params;
        const { status, notes } = req.body;

        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const attendance = employee.attendance.id(attendanceId);

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        if (status) attendance.status = status;
        if (notes !== undefined) attendance.notes = notes;

        await employee.save();

        res.json({
            success: true,
            data: attendance,
            message: 'Attendance updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc Delete attendance record
// @route DELETE /api/attendance/:employeeId/:attendanceId
// @access Private (Manager/Admin)
const deleteAttendance = async (req, res) => {
    try {
        const { employeeId, attendanceId } = req.params;

        const employee = await Employee.findById(employeeId);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        employee.attendance.pull(attendanceId);
        await employee.save();

        res.json({
            success: true,
            message: 'Attendance record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    markAttendance,
    getEmployeeAttendance,
    getShiftAttendance,
    getMonthlyAttendanceSummary,
    updateAttendance,
    deleteAttendance
};