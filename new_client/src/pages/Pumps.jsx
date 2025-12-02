import React, { useState, useEffect } from "react";
import { pumpService } from "../services/pumpService";
import { tankService } from "../services/tankService";
import { employeeService } from "../services/employeeService";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Fuel,
    Gauge,
    Calendar,
    Wrench,
    Plus,
    X,
    AlertTriangle,
    CheckCircle,
    Clock,
    ChevronDown,
    ChevronUp,
    List,
    UserPlus,
    Edit2,
    Trash2
} from "lucide-react";

export default function Pumps() {
    const [pumps, setPumps] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showNozzleModal, setShowNozzleModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedPump, setSelectedPump] = useState(null);
    const [selectedNozzle, setSelectedNozzle] = useState(null);
    const [expandedPumps, setExpandedPumps] = useState(new Set());

    const [createForm, setCreateForm] = useState({
        pumpNumber: "",
        tankId: "",
        status: "active",
        locationDescription: ""
    });

    const [updateForm, setUpdateForm] = useState({
        status: "",
        lastCalibrationDate: ""
    });

    const [nozzleForm, setNozzleForm] = useState({
        nozzleId: "",
        fueltype: "petrol",
        currentReading: 0,
        assignedEmployee: ""
    });

    const [assignForm, setAssignForm] = useState({
        assignedEmployee: ""
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [pumpsRes, tanksRes, empsRes] = await Promise.all([
                pumpService.getAll(),
                tankService.getAll(),
                employeeService.getAll()
            ]);
            setPumps(pumpsRes.data.data || []);
            setTanks(tanksRes.data.data || []);
            setEmployees(empsRes.data.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await pumpService.create(createForm);
            setShowCreateModal(false);
            setCreateForm({
                pumpNumber: "",
                tankId: "",
                status: "active",
                locationDescription: ""
            });
            fetchInitialData();
            alert("Pump created successfully!");
        } catch (error) {
            console.error("Error creating pump:", error);
            alert(error.response?.data?.message || "Error creating pump");
        }
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            await pumpService.update(selectedPump._id, updateForm);
            setShowUpdateModal(false);
            fetchInitialData();
            alert("Pump updated successfully!");
        } catch (error) {
            console.error("Error updating pump:", error);
            alert(error.response?.data?.message || "Error updating pump");
        }
    };

    const handleNozzleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedNozzle) {
                // Update existing nozzle
                await pumpService.updateNozzleReading(selectedPump._id, selectedNozzle._id, {
                    currentReading: parseFloat(nozzleForm.currentReading)
                });
                alert("Nozzle updated successfully!");
            } else {
                // Add new nozzle
                await pumpService.addNozzle(selectedPump._id, nozzleForm);
                alert("Nozzle added successfully!");
            }
            setShowNozzleModal(false);
            setSelectedNozzle(null);
            setNozzleForm({
                nozzleId: "",
                fueltype: "petrol",
                currentReading: 0,
                assignedEmployee: ""
            });
            fetchInitialData();
        } catch (error) {
            console.error("Error with nozzle:", error);
            alert(error.response?.data?.message || "Error with nozzle operation");
        }
    };

    const handleAssignEmployee = async (e) => {
        e.preventDefault();
        try {
            const endpoint = `/pumps/${selectedPump._id}/nozzles/${selectedNozzle._id}/assign`;
            await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ assignedEmployee: assignForm.assignedEmployee || null })
            });
            setShowAssignModal(false);
            setAssignForm({ assignedEmployee: "" });
            fetchInitialData();
            alert("Employee assigned successfully!");
        } catch (error) {
            console.error("Error assigning employee:", error);
            alert("Error assigning employee");
        }
    };

    const openUpdateModal = (pump) => {
        setSelectedPump(pump);
        setUpdateForm({
            status: pump.status,
            lastCalibrationDate: pump.lastCalibrationDate ? new Date(pump.lastCalibrationDate).toISOString().split('T')[0] : ""
        });
        setShowUpdateModal(true);
    };

    const openAddNozzleModal = (pump) => {
        setSelectedPump(pump);
        setSelectedNozzle(null);
        setNozzleForm({
            nozzleId: "",
            fueltype: pump.tankId?.fuelType || "petrol",
            currentReading: 0,
            assignedEmployee: ""
        });
        setShowNozzleModal(true);
    };

    const openEditNozzleModal = (pump, nozzle) => {
        setSelectedPump(pump);
        setSelectedNozzle(nozzle);
        setNozzleForm({
            nozzleId: nozzle.nozzleId,
            fueltype: nozzle.fueltype || nozzle.fuelType,
            currentReading: nozzle.currentReading || 0,
            assignedEmployee: nozzle.assignedEmployee?._id || ""
        });
        setShowNozzleModal(true);
    };

    const openAssignModal = (pump, nozzle) => {
        setSelectedPump(pump);
        setSelectedNozzle(nozzle);
        setAssignForm({
            assignedEmployee: nozzle.assignedEmployee?._id || ""
        });
        setShowAssignModal(true);
    };

    const togglePumpExpand = (pumpId) => {
        const newExpanded = new Set(expandedPumps);
        if (newExpanded.has(pumpId)) {
            newExpanded.delete(pumpId);
        } else {
            newExpanded.add(pumpId);
        }
        setExpandedPumps(newExpanded);
    };

    const getFuelColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'petrol': return 'text-orange-600 bg-orange-100';
            case 'diesel': return 'text-blue-600 bg-blue-100';
            case 'cng': return 'text-green-600 bg-green-100';
            default: return 'text-slate-600 bg-slate-100';
        }
    };

    const getNextCalibrationDate = (lastDate) => {
        if (!lastDate) return null;
        const date = new Date(lastDate);
        date.setMonth(date.getMonth() + 2);
        return date;
    };

    const isCalibrationOverdue = (lastDate) => {
        const nextDate = getNextCalibrationDate(lastDate);
        return nextDate && new Date() > nextDate;
    };

    if (loading && !pumps.length) {
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
                                <h1 className="text-slate-900 flex items-center gap-2 text-2xl font-bold">
                                    Pump & Nozzle Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Monitor and maintain fuel pumps & nozzles</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Pump
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Pump Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pumps.map((pump) => {
                        const nextCalibration = getNextCalibrationDate(pump.lastCalibrationDate);
                        const isOverdue = isCalibrationOverdue(pump.lastCalibrationDate);
                        const isExpanded = expandedPumps.has(pump._id);

                        return (
                            <Card key={pump._id} className="p-6 flex flex-col h-full">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${getFuelColor(pump.tankId?.fuelType)}`}>
                                                <Fuel className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{pump.pumpNumber}</h3>
                                                <p className="text-xs text-slate-500 font-medium uppercase">{pump.tankId?.tankNumber ? `Tank-${pump.tankId.tankNumber}` : 'No Tank'}</p>
                                            </div>
                                        </div>
                                        <Badge className={pump.status === 'active' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-orange-100 text-orange-700 border-orange-200"}>
                                            {pump.status === 'active' ? "Active" : "Maintenance"}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Fuel Type</p>
                                            <p className="text-sm font-semibold text-slate-900 capitalize">{pump.tankId?.fuelType || 'Unknown'}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Nozzles</p>
                                            <p className="text-sm font-semibold text-slate-900">{pump.nozzles?.length || 0} Nozzle(s)</p>
                                        </div>

                                        {/* Expandable Nozzle List */}
                                        {pump.nozzles && pump.nozzles.length > 0 && (
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => togglePumpExpand(pump._id)}
                                                    className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <List className="w-4 h-4" />
                                                        View Nozzles
                                                    </span>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                {isExpanded && (
                                                    <div className="divide-y divide-slate-100">
                                                        {pump.nozzles.map((nozzle) => (
                                                            <div key={nozzle._id} className="p-3 bg-white">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-slate-900">{nozzle.nozzleId}</p>
                                                                        <p className="text-xs text-slate-500 capitalize">{nozzle.fueltype || nozzle.fuelType}</p>
                                                                    </div>
                                                                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                                                        {nozzle.currentReading?.toLocaleString() || 0} L
                                                                    </Badge>
                                                                </div>
                                                                <div className="mb-2">
                                                                    <p className="text-xs text-slate-500">Assigned to:</p>
                                                                    <p className="text-sm font-medium text-slate-700">
                                                                        {nozzle.assignedEmployee?.name || 'Unassigned'}
                                                                    </p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => openEditNozzleModal(pump, nozzle)}
                                                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-slate-200 rounded hover:bg-slate-50 text-slate-600 transition-colors"
                                                                    >
                                                                        <Edit2 className="w-3 h-3" />
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openAssignModal(pump, nozzle)}
                                                                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-orange-200 rounded hover:bg-orange-50 text-orange-600 transition-colors"
                                                                    >
                                                                        <UserPlus className="w-3 h-3" />
                                                                        Assign
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-slate-100">
                                    <button
                                        onClick={() => openAddNozzleModal(pump)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Nozzle
                                    </button>
                                    <button
                                        onClick={() => openUpdateModal(pump)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                                    >
                                        <Wrench className="w-4 h-4" />
                                        Update Pump
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Calibration Schedule Table */}
                <Card className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-semibold text-slate-900">Calibration & Maintenance Schedule</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Pump ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fuel Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Calibration</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Next Due</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {pumps.map((pump) => {
                                    const nextCalibration = getNextCalibrationDate(pump.lastCalibrationDate);
                                    const isOverdue = isCalibrationOverdue(pump.lastCalibrationDate);

                                    return (
                                        <tr key={pump._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {pump.pumpNumber}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                                                {pump.tankId?.fuelType || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {pump.lastCalibrationDate ? new Date(pump.lastCalibrationDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={isOverdue ? "text-red-600 font-medium" : "text-slate-600"}>
                                                    {nextCalibration ? nextCalibration.toLocaleDateString() : '-'}
                                                </span>
                                                {isOverdue && <span className="ml-2 text-xs text-red-500">(Overdue)</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={!isOverdue ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}>
                                                    {!isOverdue ? "Up to date" : "Overdue"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => openUpdateModal(pump)}
                                                    className="text-slate-600 hover:text-orange-600 transition-colors"
                                                >
                                                    Schedule
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Create Pump Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">Add New Pump</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Pump Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.pumpNumber}
                                    onChange={(e) => setCreateForm({ ...createForm, pumpNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g. P-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Connected Tank
                                </label>
                                <select
                                    required
                                    value={createForm.tankId}
                                    onChange={(e) => setCreateForm({ ...createForm, tankId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="">Select Tank</option>
                                    {tanks.map(tank => (
                                        <option key={tank._id} value={tank._id}>
                                            Tank-{tank.tankNumber} ({tank.fuelType})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={createForm.status}
                                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="under-maintainance">Under Maintenance</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Location Description
                                </label>
                                <input
                                    type="text"
                                    value={createForm.locationDescription}
                                    onChange={(e) => setCreateForm({ ...createForm, locationDescription: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g. Near Main Entrance"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Create Pump
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Pump Modal */}
            {showUpdateModal && selectedPump && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">Update Pump {selectedPump.pumpNumber}</h3>
                            <button
                                onClick={() => setShowUpdateModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={updateForm.status}
                                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="under-maintainance">Under Maintenance</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Last Calibration Date
                                </label>
                                <input
                                    type="date"
                                    value={updateForm.lastCalibrationDate}
                                    onChange={(e) => setUpdateForm({ ...updateForm, lastCalibrationDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowUpdateModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Update Pump
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Edit Nozzle Modal */}
            {showNozzleModal && selectedPump && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {selectedNozzle ? 'Update Nozzle' : 'Add Nozzle'} - {selectedPump.pumpNumber}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowNozzleModal(false);
                                    setSelectedNozzle(null);
                                }}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleNozzleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nozzle ID
                                </label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!selectedNozzle}
                                    value={nozzleForm.nozzleId}
                                    onChange={(e) => setNozzleForm({ ...nozzleForm, nozzleId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                                    placeholder="e.g. N-001-A"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Fuel Type
                                </label>
                                <select
                                    required
                                    disabled={!!selectedNozzle}
                                    value={nozzleForm.fueltype}
                                    onChange={(e) => setNozzleForm({ ...nozzleForm, fueltype: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100"
                                >
                                    <option value="petrol">Petrol</option>
                                    <option value="diesel">Diesel</option>
                                    <option value="cng">CNG</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Current Reading (L)
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    value={nozzleForm.currentReading}
                                    onChange={(e) => setNozzleForm({ ...nozzleForm, currentReading: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            {!selectedNozzle && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Assign Employee (Optional)
                                    </label>
                                    <select
                                        value={nozzleForm.assignedEmployee}
                                        onChange={(e) => setNozzleForm({ ...nozzleForm, assignedEmployee: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Unassigned</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} - {emp.position.toUpperCase() || emp.role.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNozzleModal(false);
                                        setSelectedNozzle(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    {selectedNozzle ? 'Update' : 'Add'} Nozzle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Employee Modal */}
            {showAssignModal && selectedPump && selectedNozzle && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">
                                Assign Employee - {selectedNozzle.nozzleId}
                            </h3>
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignEmployee} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Select Employee
                                </label>
                                <select
                                    value={assignForm.assignedEmployee}
                                    onChange={(e) => setAssignForm({ assignedEmployee: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Unassign</option>
                                    {employees.map(emp => (
                                        <option key={emp._id} value={emp._id}>
                                            {emp.name} - {emp.position || emp.role}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Select "Unassign" to remove employee assignment</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Assign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
