import React, { useState, useEffect } from "react";
import { shiftService } from "../services/shiftService";
import { tankService } from "../services/tankService";
import { pumpService } from "../services/pumpService";
import { employeeService } from "../services/employeeService";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Clock,
    DollarSign,
    Users,
    AlertCircle,
    CheckCircle,
    Play,
    StopCircle,
    Eye,
    X,
    Droplets,
    Gauge,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export default function Shifts() {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [tanks, setTanks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [pumps, setPumps] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const shiftsPerPage = 10;

    // Form states
    const [createForm, setCreateForm] = useState({
        openingCash: 0,
        assignedEmployees: [],
        supervisorId: "",
        startTime: new Date().toISOString().slice(0, 16),
    });

    const [closeForm, setCloseForm] = useState({
        closingCash: 0,
        endTime: new Date().toISOString().slice(0, 16),
        tankReadings: [],
        pumpReadings: []
    });

    useEffect(() => {
        fetchShifts();
        fetchTanks();
        fetchPumps();
        fetchEmployees();
    }, []);

    const fetchShifts = async () => {
        try {
            const res = await shiftService.getAll();
            setShifts(res.data.data || []);
        } catch (error) {
            console.error("Error fetching shifts:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTanks = async () => {
        try {
            const res = await tankService.getAll();
            setTanks(res.data.data || []);
        } catch (error) {
            console.error("Error fetching tanks:", error);
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

    const fetchPumps = async () => {
        try {
            const res = await pumpService.getAll();
            setPumps(res.data.data || []);
        } catch (error) {
            console.error("Error fetching pumps:", error);
        }
    };

    const handleCreateShift = async (e) => {
        e.preventDefault();
        try {
            await shiftService.create(createForm);
            setShowCreateModal(false);
            fetchShifts();
            // Reset form
            setCreateForm({
                openingCash: 0,
                assignedEmployees: [],
                supervisorId: "",
                startTime: new Date().toISOString().slice(0, 16),
            });
            toast.success("Shift started successfully!");
        } catch (error) {
            console.error("Error creating shift:", error);
            toast.error(error.response?.data?.message || "Error creating shift");
        }
    };

    const handleCloseShift = async (e) => {
        e.preventDefault();
        try {
            console.log('Closing shift with data:', closeForm);
            await shiftService.closeShift(selectedShift._id, closeForm);
            setShowCloseModal(false);
            setSelectedShift(null);
            setCloseForm({
                closingCash: 0,
                endTime: new Date().toISOString().slice(0, 16),
                tankReadings: [],
                pumpReadings: []
            });
            fetchShifts();
            toast.success("Shift closed successfully!");
        } catch (error) {
            console.error('Close shift error:', error);
            console.error('Response:', error.response?.data);
            alert(error.response?.data?.message || "Error closing shift");
        }
    };

    const openCloseModal = async (shift) => {
        setSelectedShift(shift);

        try {
            // Fetch shift summary to get auto-calculated closing cash
            const summaryRes = await shiftService.getShiftSummary(shift._id);
            const summary = summaryRes.data.data;

            const tankReadings = tanks.map(tank => ({
                tankId: tank._id,
                tankName: tank.name,
                fuelType: tank.fuelType,
                openingReading: tank.currentLevel || 0,
                closingReading: tank.currentLevel || 0
            }));

            // Initialize pump readings for all pumps
            const pumpReadings = pumps.flatMap(pump =>
                pump.nozzles?.map(nozzle => ({
                    pumpId: pump._id,
                    pumpName: pump.pumpNumber,
                    nozzleId: nozzle._id,
                    nozzleName: nozzle.nozzleId,
                    fuelType: nozzle.fuelType || nozzle.fueltype,
                    openingReading: nozzle.currentReading || 0,
                    closingReading: nozzle.currentReading || 0
                })) || []
            );

            setCloseForm({
                closingCash: summary.suggestedClosingCash || 0, // Auto-populate from summary
                endTime: new Date().toISOString().slice(0, 16),
                pumpReadings,
                tankReadings
            });
            setShowCloseModal(true);
        } catch (error) {
            console.error('Error fetching shift summary:', error);
            // Fallback to manual entry if fetch fails
            const tankReadings = tanks.map(tank => ({
                tankId: tank._id,
                tankName: tank.name,
                fuelType: tank.fuelType,
                openingReading: tank.currentLevel || 0,
                closingReading: tank.currentLevel || 0
            }));

            const pumpReadings = pumps.flatMap(pump =>
                pump.nozzles?.map(nozzle => ({
                    pumpId: pump._id,
                    pumpName: pump.pumpNumber,
                    nozzleId: nozzle._id,
                    nozzleName: nozzle.nozzleId,
                    fuelType: nozzle.fuelType || nozzle.fueltype,
                    openingReading: nozzle.currentReading || 0,
                    closingReading: nozzle.currentReading || 0
                })) || []
            );

            setCloseForm({
                closingCash: 0,
                endTime: new Date().toISOString().slice(0, 16),
                pumpReadings,
                tankReadings
            });
            setShowCloseModal(true);
            toast.error('Could not fetch shift summary. Please enter closing cash manually.');
        }
    };

    const openDetailsModal = (shift) => {
        setSelectedShift(shift);
        setShowDetailsModal(true);
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: { className: "bg-emerald-100 text-emerald-700 border-0", label: "Closed" },
            closed: { className: "bg-slate-100 text-slate-700 border-0", label: "Closed" },
            reconciled: { className: "bg-blue-100 text-blue-700 border-0", label: "Reconciled" }
        };
        return badges[status] || badges.closed;
    };

    const getShiftName = (shift) => {
        const hour = new Date(shift.startTime).getHours();
        if (hour >= 6 && hour < 14) return "Morning Shift";
        if (hour >= 14 && hour < 22) return "Evening Shift";
        return "Night Shift";
    };

    const calculateDuration = (start, end) => {
        if (!end) {
            const now = new Date();
            const startTime = new Date(start);
            const diff = now - startTime;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
        }
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diff = endTime - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const activeShift = shifts.find(s => s.status === 'active');
    const closedShifts = shifts.filter(s => s.status !== 'active');

    // Pagination
    const indexOfLastShift = currentPage * shiftsPerPage;
    const indexOfFirstShift = indexOfLastShift - shiftsPerPage;
    const currentShifts = closedShifts.slice(indexOfFirstShift, indexOfLastShift);
    const totalPages = Math.ceil(closedShifts.length / shiftsPerPage);

    if (loading) {
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
                                    Shift Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600">Monitor and manage fuel pump shifts</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            disabled={!!activeShift}
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Play className="w-4 h-4" />
                            Start New Shift
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-6">
                {/* Active Shift Section */}
                {activeShift && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-900">Active Shift</h2>
                        </div>
                        <Card className="p-6 bg-orange-50/50 border-orange-100">
                            <div className="mb-4">
                                <Badge className="bg-emerald-500 text-white border-0 font-medium">Live</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-6">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Shift ID</p>
                                    <p className="text-sm font-semibold text-slate-900">SH-{activeShift.shiftNumber?.toString().padStart(3, '0')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Pumps Assigned</p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {activeShift.assignedEmployees?.length > 0 ? `${activeShift.assignedEmployees.length} Pumps` : 'Not Set'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Start Time</p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Duration</p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {calculateDuration(activeShift.startTime)}
                                    </p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <DollarSign className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Total Sales</p>
                                        <p className="text-sm font-bold text-slate-900">₹{activeShift.totalSales?.toLocaleString() || '0'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Gauge className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Transactions</p>
                                        <p className="text-sm font-bold text-slate-900">0</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => openCloseModal(activeShift)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <StopCircle className="w-4 h-4" />
                                Close Shift
                            </button>
                        </Card>
                    </div>
                )}

                {/* Shift History */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Shift History</h2>
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Shift ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Shift Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Pumps</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">End Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sales</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {currentShifts.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                                No shift history available
                                            </td>
                                        </tr>
                                    ) : (
                                        currentShifts.map((shift) => {
                                            const statusBadge = getStatusBadge(shift.status);
                                            return (
                                                <tr key={shift._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        SH-{shift.shiftNumber?.toString().padStart(3, '0')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        {getShiftName(shift)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        {shift.assignedEmployees?.length > 0 ? `${shift.assignedEmployees.length} Pumps` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        {shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        ₹{shift.totalSales?.toLocaleString() || '0'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge className={statusBadge.className}>
                                                            {statusBadge.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button
                                                            onClick={() => openDetailsModal(shift)}
                                                            className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                                <div className="text-sm text-slate-600">
                                    Showing {indexOfFirstShift + 1} to {Math.min(indexOfLastShift, closedShifts.length)} of {closedShifts.length} shifts
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === i + 1
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Create Shift Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Start New Shift</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-1 hover:bg-slate-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateShift} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Opening Cash (₹)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={createForm.openingCash}
                                    onChange={(e) => setCreateForm({ ...createForm, openingCash: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={createForm.startTime}
                                    onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Assign Pumps
                                </label>
                                <div className="max-h-40 overflow-y-auto border border-slate-300 rounded-lg p-2 space-y-2">
                                    {pumps.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-2">No pumps available</p>
                                    ) : (
                                        pumps.map(pump => (
                                            <label key={pump._id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={createForm.assignedEmployees.includes(pump._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setCreateForm({
                                                                ...createForm,
                                                                assignedEmployees: [...createForm.assignedEmployees, pump._id]
                                                            });
                                                        } else {
                                                            setCreateForm({
                                                                ...createForm,
                                                                assignedEmployees: createForm.assignedEmployees.filter(id => id !== pump._id)
                                                            });
                                                        }
                                                    }}
                                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-700">{pump.pumpNumber}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Supervisor (Optional)
                                </label>
                                <select
                                    value={createForm.supervisorId}
                                    onChange={(e) => setCreateForm({ ...createForm, supervisorId: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Select Supervisor</option>
                                    {employees.filter(e => e.position === 'manager' || e.position === 'supervisor').map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Start Shift
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Close Shift Modal */}
            {showCloseModal && selectedShift && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Close Shift {selectedShift.shiftNumber}</h2>
                            <button
                                onClick={() => setShowCloseModal(false)}
                                className="p-1 hover:bg-slate-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCloseShift} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Closing Cash (₹)
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={closeForm.closingCash}
                                    onChange={(e) => setCloseForm({ ...closeForm, closingCash: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    End Time
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={closeForm.endTime}
                                    onChange={(e) => setCloseForm({ ...closeForm, endTime: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <Droplets className="w-4 h-4" />
                                    Tank Readings
                                </h3>
                                <div className="space-y-2">
                                    {closeForm.tankReadings.map((reading, index) => (
                                        <div key={index} className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded">
                                            <div>
                                                <p className="text-xs text-slate-500">{reading.tankName}</p>
                                                <p className="text-xs font-medium text-slate-700">{reading.fuelType}</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500">Opening</label>
                                                <input
                                                    type="number"
                                                    readOnly
                                                    value={reading.openingReading}
                                                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500">Closing</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={reading.closingReading}
                                                    onChange={(e) => {
                                                        const newReadings = [...closeForm.tankReadings];
                                                        newReadings[index].closingReading = parseFloat(e.target.value);
                                                        setCloseForm({ ...closeForm, tankReadings: newReadings });
                                                    }}
                                                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <Gauge className="w-4 h-4" />
                                    Pump/Nozzle Readings
                                </h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {closeForm.pumpReadings && closeForm.pumpReadings.length > 0 ? (
                                        closeForm.pumpReadings.map((reading, index) => (
                                            <div key={index} className="grid grid-cols-4 gap-2 p-2 bg-slate-50 rounded">
                                                <div>
                                                    <p className="text-xs text-slate-500">{reading.pumpName}</p>
                                                    <p className="text-xs font-medium text-slate-700">{reading.nozzleName}</p>
                                                    <p className="text-xs text-slate-600">{reading.fuelType}</p>
                                                </div>
                                                <div className="col-span-3 grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-slate-500">Opening</label>
                                                        <input
                                                            type="number"
                                                            readOnly
                                                            value={reading.openingReading}
                                                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-slate-500">Closing</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            value={reading.closingReading}
                                                            onChange={(e) => {
                                                                const newReadings = [...closeForm.pumpReadings];
                                                                newReadings[index].closingReading = parseFloat(e.target.value);
                                                                setCloseForm({ ...closeForm, pumpReadings: newReadings });
                                                            }}
                                                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 text-center py-4">No pumps/nozzles configured</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCloseModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Close Shift
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Shift Details Modal */}
            {showDetailsModal && selectedShift && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Shift {selectedShift.shiftNumber} Details</h2>
                                <p className="text-sm text-slate-500">{new Date(selectedShift.date).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-1 hover:bg-slate-100 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Total Sales</p>
                                    <p className="text-lg font-bold text-slate-900">₹{selectedShift.totalSales?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Cash</p>
                                    <p className="text-lg font-bold text-slate-900">₹{selectedShift.cashCollected?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">Card</p>
                                    <p className="text-lg font-bold text-slate-900">₹{selectedShift.cardPayments?.toLocaleString() || 0}</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-500 mb-1">UPI</p>
                                    <p className="text-lg font-bold text-slate-900">₹{selectedShift.upiPayments?.toLocaleString() || 0}</p>
                                </div>
                            </div>

                            {/* Cash Flow */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 mb-2">Cash Flow</h3>
                                <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Opening Cash:</span>
                                        <span className="font-medium">₹{selectedShift.openingCash?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Cash Sales:</span>
                                        <span className="font-medium">₹{selectedShift.cashCollected?.toLocaleString() || 0}</span>
                                    </div>
                                    {selectedShift.closingCash !== undefined && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600">Closing Cash:</span>
                                                <span className="font-medium">₹{selectedShift.closingCash?.toLocaleString() || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                                                <span className="text-slate-600 font-semibold">Variance:</span>
                                                <span className={`font-semibold ${(selectedShift.closingCash - selectedShift.openingCash - selectedShift.cashCollected) >= 0
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    ₹{((selectedShift.closingCash || 0) - (selectedShift.openingCash || 0) - (selectedShift.cashCollected || 0)).toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Discrepancies */}
                            {selectedShift.discrepancies && selectedShift.discrepancies.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Discrepancies</h3>
                                    <div className="space-y-2">
                                        {selectedShift.discrepancies.map((disc, idx) => (
                                            <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-slate-900">{disc.reason}</p>
                                                        <p className="text-sm text-slate-600">Amount: ₹{disc.amount?.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tank Readings */}
                            {selectedShift.tankReadings && selectedShift.tankReadings.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Tank Readings</h3>
                                    <div className="space-y-2">
                                        {selectedShift.tankReadings.map((reading, idx) => (
                                            <div key={idx} className="grid grid-cols-4 gap-2 p-2 bg-slate-50 rounded text-sm">
                                                <div>
                                                    <p className="text-xs text-slate-500">Tank</p>
                                                    <p className="font-medium">{reading.tankName || `Tank ${idx + 1}`}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Fuel Type</p>
                                                    <p className="font-medium">{reading.fuelType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Opening</p>
                                                    <p className="font-medium">{reading.openingReading}L</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Closing</p>
                                                    <p className="font-medium">{reading.closingReading}L</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pump Readings */}
                            {selectedShift.pumpReadings && selectedShift.pumpReadings.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Pump/Nozzle Readings</h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {selectedShift.pumpReadings.map((reading, idx) => (
                                            <div key={idx} className="grid grid-cols-5 gap-2 p-2 bg-slate-50 rounded text-sm">
                                                <div>
                                                    <p className="text-xs text-slate-500">Pump</p>
                                                    <p className="font-medium">{reading.pumpName || `Pump ${idx + 1}`}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Nozzle</p>
                                                    <p className="font-medium">{reading.nozzleName || reading.nozzleId}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Fuel</p>
                                                    <p className="font-medium">{reading.fuelType}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Opening</p>
                                                    <p className="font-medium">{reading.openingReading}L</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500">Closing</p>
                                                    <p className="font-medium">{reading.closingReading}L</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}