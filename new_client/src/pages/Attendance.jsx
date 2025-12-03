import React, { useState, useEffect } from "react";
import { attendanceService } from "../services/attendanceService";
import { shiftService } from "../services/shiftService";
import { employeeService } from "../services/employeeService";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    Calendar,
    Download,
    Filter,
    Search,
    Trash2,
    X,
    User
} from "lucide-react";

export default function Attendance() {
    const [activeTab, setActiveTab] = useState("today"); // "today", "history", "summary"
    const [loading, setLoading] = useState(false);
    const [attendanceData, setAttendanceData] = useState([]);
    const [summaryStats, setSummaryStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        avgAttendance: "0%"
    });
    const [activeShift, setActiveShift] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState(null);
    const [employeeHistory, setEmployeeHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Monthly summary state
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [monthlySummary, setMonthlySummary] = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(false);

    const [showMarkModal, setShowMarkModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [markForm, setMarkForm] = useState({
        employeeId: "",
        status: "present",
        notes: ""
    });

    useEffect(() => {
        fetchInitialData();
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (activeTab === "today" && activeShift) {
            fetchShiftAttendance(activeShift._id);
        } else if (activeTab === "history" && selectedEmployeeForHistory) {
            fetchEmployeeHistory();
        } else if (activeTab === "summary") {
            fetchMonthlySummary();
        }
    }, [activeTab, activeShift, selectedEmployeeForHistory, selectedMonth, selectedYear]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            // Fetch active shift
            const shiftsRes = await shiftService.getAll();
            const active = shiftsRes.data.data?.find(s => s.status === 'active');
            setActiveShift(active || null);

            // Fetch total employees count
            const empRes = await employeeService.getAll();
            const totalEmps = empRes.data.data?.length || 0;

            // If active shift exists, fetch its attendance to populate stats
            if (active) {
                const attRes = await attendanceService.getShiftAttendance(active._id);
                const summary = attRes.data.data.summary;

                setSummaryStats({
                    totalEmployees: totalEmps,
                    presentToday: summary.present,
                    absentToday: summary.absent,
                    avgAttendance: totalEmps > 0 ? `${((summary.present / totalEmps) * 100).toFixed(1)}%` : "0%"
                });
            } else {
                setSummaryStats(prev => ({ ...prev, totalEmployees: totalEmps }));
            }

        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await employeeService.getAll();
            setEmployees(res.data.data || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const handleMarkAttendance = async (e) => {
        e.preventDefault();
        if (!activeShift) {
            toast.error("No active shift found!");
            return;
        }
        if (!markForm.employeeId) {
            toast.error("Please select an employee.");
            return;
        }

        try {
            await attendanceService.markAttendance({
                ...markForm,
                shiftId: activeShift._id
            });
            setShowMarkModal(false);
            setMarkForm({ employeeId: "", status: "present", notes: "" });
            // Refresh data
            fetchShiftAttendance(activeShift._id);
            fetchInitialData(); // Update stats
            toast.success("Attendance marked successfully!");
        } catch (error) {
            console.error("Error marking attendance:", error);
            toast.error(error.response?.data?.message || "Error marking attendance");
        }
    };

    const handleQuickMark = async (employeeId, status) => {
        if (!activeShift) {
            toast.error("No active shift found!");
            return;
        }

        try {
            await attendanceService.markAttendance({
                employeeId,
                status,
                shiftId: activeShift._id,
                notes: `Quick marked as ${status}`
            });

            // Optimistic update or refresh
            fetchShiftAttendance(activeShift._id);
            fetchInitialData(); // Update stats
            toast.success(`Marked as ${status}`);
        } catch (error) {
            console.error("Error marking attendance:", error);
            toast.error(error.response?.data?.message || "Error marking attendance");
        }
    };

    const handleDeleteClick = (record) => {
        setDeleteTarget(record);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget || !activeShift) return;

        try {
            // Find the attendance record ID for this employee and shift
            const employee = employees.find(e => e._id === deleteTarget._id);
            if (!employee) {
                toast.error("Employee not found");
                return;
            }

            // Get employee's attendance data to find the specific attendance ID
            const empAttendanceRes = await attendanceService.getEmployeeAttendance(deleteTarget._id);
            const attendanceRecord = empAttendanceRes.data.data.attendance.find(
                att => att.shiftId && att.shiftId._id === activeShift._id
            );

            if (!attendanceRecord) {
                toast.error("Attendance record not found");
                return;
            }

            await attendanceService.deleteAttendance(deleteTarget._id, attendanceRecord._id);
            setShowDeleteModal(false);
            setDeleteTarget(null);

            // Refresh data
            fetchShiftAttendance(activeShift._id);
            fetchInitialData();
            toast.success("Attendance deleted successfully!");
        } catch (error) {
            console.error("Error deleting attendance:", error);
            toast.error(error.response?.data?.message || "Error deleting attendance");
        }
    };

    const fetchShiftAttendance = async (shiftId) => {
        try {
            setLoading(true);
            const res = await attendanceService.getShiftAttendance(shiftId);
            setAttendanceData(res.data.data.attendance || []);
        } catch (error) {
            console.error("Error fetching shift attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeHistory = async () => {
        if (!selectedEmployeeForHistory) return;

        try {
            setHistoryLoading(true);
            const res = await attendanceService.getEmployeeAttendance(selectedEmployeeForHistory._id);
            setEmployeeHistory(res.data.data.attendance || []);
        } catch (error) {
            console.error("Error fetching employee history:", error);
            toast.error("Failed to fetch attendance history");
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchMonthlySummary = async () => {
        try {
            setSummaryLoading(true);
            const res = await attendanceService.getMonthlySummary(selectedMonth, selectedYear);
            setMonthlySummary(res.data.data.employees || []);
        } catch (error) {
            console.error("Error fetching monthly summary:", error);
            toast.error("Failed to fetch monthly summary");
        } finally {
            setSummaryLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            present: "bg-emerald-100 text-emerald-700 border-0",
            absent: "bg-red-100 text-red-700 border-0",
            leave: "bg-orange-100 text-orange-700 border-0",
            late: "bg-yellow-100 text-yellow-700 border-0",
            not_marked: "bg-slate-100 text-slate-700 border-0"
        };
        return classes[status?.toLowerCase()] || classes.not_marked;
    };

    if (loading && !attendanceData.length && !showMarkModal) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-slate-50 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-slate-900 flex items-center gap-2">
                                    Attendance Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Track employee attendance and work hours</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowMarkModal(true)}
                            disabled={!activeShift}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            Mark Attendance
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-8">
                    <div className="flex gap-4 border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab("today")}
                            className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === "today"
                                ? "text-orange-600 border-b-2 border-orange-600"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Today's Attendance
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === "history"
                                ? "text-orange-600 border-b-2 border-orange-600"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Attendance Records
                        </button>
                        <button
                            onClick={() => setActiveTab("summary")}
                            className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === "summary"
                                ? "text-orange-600 border-b-2 border-orange-600"
                                : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Monthly Summary
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Employees</p>
                            <h3 className="text-2xl font-bold text-slate-900">{summaryStats.totalEmployees}</h3>
                        </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 rounded-lg">
                            <UserCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Present Today</p>
                            <h3 className="text-2xl font-bold text-slate-900">{summaryStats.presentToday}</h3>
                        </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                            <UserX className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Absent Today</p>
                            <h3 className="text-2xl font-bold text-slate-900">{summaryStats.absentToday}</h3>
                        </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Avg Attendance</p>
                            <h3 className="text-2xl font-bold text-slate-900">{summaryStats.avgAttendance}</h3>
                        </div>
                    </Card>
                </div>

                {/* Content Area */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {activeTab === "today" ? `Today's Attendance - ${new Date().toLocaleDateString()}` :
                                activeTab === "history" ? "Attendance Records" : "Monthly Summary"}
                        </h2>
                        <div className="flex gap-2">
                            {activeTab === "history" && (
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            )}
                            <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {activeTab === "today" ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Shift</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check In</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Check Out</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {attendanceData.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                                {activeShift ? "No attendance records found for active shift" : "No active shift currently running"}
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceData.map((record) => (
                                            <tr key={record.employeeId} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {record.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 capitalize">
                                                    {record.position?.replace('_', ' ')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    {activeShift ? `Shift #${activeShift.shiftNumber}` : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    {record.markedAt ? new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                    -
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {record.status === 'not_marked' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleQuickMark(record._id, 'present')}
                                                                className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium hover:bg-emerald-200 transition-colors"
                                                            >
                                                                Present
                                                            </button>
                                                            <button
                                                                onClick={() => handleQuickMark(record._id, 'absent')}
                                                                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors"
                                                            >
                                                                Absent
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <Badge className={getStatusBadgeClass(record.status)}>
                                                            {record.status}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    {record.status !== 'not_marked' && (
                                                        <button
                                                            onClick={() => handleDeleteClick(record)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete attendance"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : activeTab === "history" ? (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Employee</label>
                                    <select
                                        value={selectedEmployeeForHistory?._id || ""}
                                        onChange={(e) => {
                                            const emp = employees.find(emp => emp._id === e.target.value);
                                            setSelectedEmployeeForHistory(emp || null);
                                        }}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="">Select an employee</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} - {emp.position}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Attendance History Table */}
                            {selectedEmployeeForHistory ? (
                                historyLoading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Shift</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {employeeHistory.length > 0 ? (
                                                    employeeHistory.map((record, index) => (
                                                        <tr key={index} className="hover:bg-slate-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                                {new Date(record.date).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                                {record.shiftId?.shiftNumber ? `Shift #${record.shiftId.shiftNumber}` : '-'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <Badge className={getStatusBadgeClass(record.status)}>
                                                                    {record.status}
                                                                </Badge>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                                {record.notes || '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                                            No attendance records found for this employee
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                    <User className="w-12 h-12 mb-4 text-slate-300" />
                                    <p>Select an employee to view attendance history</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === "summary" ? (
                        <div className="space-y-4">
                            {/* Month/Year Filters */}
                            <div className="flex gap-4">
                                <div className="w-48">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Month</label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                            <option key={month} value={month}>
                                                {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Monthly Summary Table */}
                            {summaryLoading ? (
                                <div className="flex justify-center items-center py-12">
                                    <LoadingSpinner />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Days</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Present</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Absent</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Leave</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Attendance %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {monthlySummary.length > 0 ? (
                                                monthlySummary.map((emp, index) => (
                                                    <tr key={index} className="hover:bg-slate-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                            {emp.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 capitalize">
                                                            {emp.position?.replace('_', ' ')}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                            {emp.totalDays}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                                                            {emp.presentDays}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                                            {emp.absentDays}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                                                            {emp.leaveDays}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                                                    <div
                                                                        className="bg-emerald-500 h-2 rounded-full"
                                                                        style={{ width: emp.attendancePercentage }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-900">
                                                                    {emp.attendancePercentage}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                                        No attendance data found for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Calendar className="w-12 h-12 mb-4 text-slate-300" />
                            <p>Select a tab to view data</p>
                        </div>
                    )}               </Card>
            </div>

            {/* Mark Attendance Modal */}
            {showMarkModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">Mark Attendance</h3>
                            <button
                                onClick={() => setShowMarkModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <UserX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleMarkAttendance} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Employee
                                </label>
                                <select
                                    required
                                    value={markForm.employeeId}
                                    onChange={(e) => setMarkForm({ ...markForm, employeeId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.name} - {emp.position}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Status
                                </label>
                                <select
                                    required
                                    value={markForm.status}
                                    onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="leave">Leave</option>
                                    <option value="late">Late</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={markForm.notes}
                                    onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Any additional notes..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowMarkModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-red-50">
                            <h3 className="text-lg font-semibold text-red-900">Delete Attendance Record</h3>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteTarget(null);
                                }}
                                className="p-2 hover:bg-red-100 rounded-full transition-colors text-red-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Warning Message */}
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <UserX className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-red-900">Warning</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        This action cannot be undone. The attendance record will be permanently deleted.
                                    </p>
                                </div>
                            </div>

                            {/* Record Details */}
                            <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                                <h4 className="text-sm font-medium text-slate-900">Record Details:</h4>
                                <div className="text-sm text-slate-700 space-y-1">
                                    <p><span className="font-medium">Employee:</span> {deleteTarget.name}</p>
                                    <p><span className="font-medium">Position:</span> {deleteTarget.position?.replace('_', ' ')}</p>
                                    <p><span className="font-medium">Status:</span> <Badge className={getStatusBadgeClass(deleteTarget.status)}>{deleteTarget.status}</Badge></p>
                                    {deleteTarget.markedAt && (
                                        <p><span className="font-medium">Marked At:</span> {new Date(deleteTarget.markedAt).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeleteTarget(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Delete Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
