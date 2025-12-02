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
    Search
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

    const [showMarkModal, setShowMarkModal] = useState(false);
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
        }
    }, [activeTab, activeShift]);

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
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {attendanceData.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
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
                                                    <Badge className={getStatusBadgeClass(record.status)}>
                                                        {record.status === 'not_marked' ? 'Not Marked' : record.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Calendar className="w-12 h-12 mb-4 text-slate-300" />
                            <p>Select "Today's Attendance" to view current status</p>
                            <p className="text-sm mt-2">History and Summary views coming soon</p>
                        </div>
                    )}
                </Card>
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
        </div>
    );
}
