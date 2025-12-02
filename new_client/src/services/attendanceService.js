import API from './api';

export const attendanceService = {
    // Mark attendance
    markAttendance: (data) => API.post('/attendance', data),

    // Get employee attendance
    getEmployeeAttendance: (employeeId, params) => API.get(`/attendance/employee/${employeeId}`, { params }),

    // Get shift attendance
    getShiftAttendance: (shiftId) => API.get(`/attendance/shift/${shiftId}`),

    // Get monthly summary
    getMonthlySummary: (month, year) => API.get('/attendance/summary/monthly', { params: { month, year } }),

    // Update attendance
    updateAttendance: (employeeId, attendanceId, data) => API.put(`/attendance/${employeeId}/${attendanceId}`, data),

    // Delete attendance
    deleteAttendance: (employeeId, attendanceId) => API.delete(`/attendance/${employeeId}/${attendanceId}`)
};
