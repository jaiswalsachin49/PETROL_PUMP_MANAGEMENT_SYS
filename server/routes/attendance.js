const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getEmployeeAttendance,
    getShiftAttendance,
    getMonthlyAttendanceSummary,
    updateAttendance,
    deleteAttendance
} = require('../controllers/attendanceController');

const { protect, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// POST /api/attendance - Mark attendance
router.post('/', authorize('admin', 'manager'), markAttendance);

// GET /api/attendance/employee/:employeeId - Get employee attendance
router.get('/employee/:employeeId', getEmployeeAttendance);

// GET /api/attendance/shift/:shiftId - Get shift attendance
router.get('/shift/:shiftId', getShiftAttendance);

// GET /api/attendance/summary/monthly - Monthly summary
router.get('/summary/monthly', authorize('admin', 'manager'), getMonthlyAttendanceSummary);

// PUT /api/attendance/:employeeId/:attendanceId - Update attendance
router.put('/:employeeId/:attendanceId', authorize('admin', 'manager'), updateAttendance);

// DELETE /api/attendance/:employeeId/:attendanceId - Delete attendance
router.delete('/:employeeId/:attendanceId', authorize('admin', 'manager'), deleteAttendance);

module.exports = router;
