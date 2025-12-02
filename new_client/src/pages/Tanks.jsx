import React, { useState, useEffect } from "react";
import { tankService } from "../services/tankService";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Droplets,
    History,
    Plus,
    AlertTriangle,
    TrendingDown,
    TrendingUp,
    Calendar,
    X,
    Fuel
} from "lucide-react";

export default function Tanks() {
    const [tanks, setTanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDipModal, setShowDipModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedTank, setSelectedTank] = useState(null);
    const [dipForm, setDipForm] = useState({
        reading: "",
        date: new Date().toISOString().split('T')[0]
    });

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        tankNumber: "",
        fuelType: "petrol",
        capacity: "",
        minimumLevel: ""
    });

    useEffect(() => {
        fetchTanks();
    }, []);

    const fetchTanks = async () => {
        try {
            setLoading(true);
            const res = await tankService.getAll();
            setTanks(res.data.data || []);
        } catch (error) {
            console.error("Error fetching tanks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await tankService.create(createForm);
            setShowCreateModal(false);
            setCreateForm({
                tankNumber: "",
                fuelType: "petrol",
                capacity: "",
                minimumLevel: ""
            });
            fetchTanks();
            alert("Tank created successfully!");
        } catch (error) {
            console.error("Error creating tank:", error);
            alert(error.response?.data?.message || "Error creating tank");
        }
    };

    const handleDipSubmit = async (e) => {
        e.preventDefault();
        try {
            await tankService.updateDipReading(selectedTank._id, dipForm.reading);
            setShowDipModal(false);
            setDipForm({ reading: "", date: new Date().toISOString().split('T')[0] });
            fetchTanks();
            alert("Dip reading updated successfully!");
        } catch (error) {
            console.error("Error updating dip reading:", error);
            alert(error.response?.data?.message || "Error updating reading");
        }
    };

    const openDipModal = (tank) => {
        setSelectedTank(tank);
        setDipForm({
            reading: "",
            date: new Date().toISOString().split('T')[0]
        });
        setShowDipModal(true);
    };

    const openHistoryModal = (tank) => {
        setSelectedTank(tank);
        setShowHistoryModal(true);
    };

    const getFuelColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'petrol': return 'text-orange-600 bg-orange-100';
            case 'diesel': return 'text-blue-600 bg-blue-100';
            case 'cng': return 'text-green-600 bg-green-100';
            default: return 'text-slate-600 bg-slate-100';
        }
    };

    const getProgressBarColor = (percentage, type) => {
        if (percentage <= 20) return 'bg-red-500';
        switch (type?.toLowerCase()) {
            case 'petrol': return 'bg-orange-500';
            case 'diesel': return 'bg-blue-500';
            case 'cng': return 'bg-green-500';
            default: return 'bg-slate-500';
        }
    };

    if (loading && !tanks.length) {
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
                                    Tank Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Monitor fuel levels and manage inventory</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Tank
                            </button>
                            <button
                                onClick={() => tanks.length > 0 && openDipModal(tanks[0])}
                                disabled={tanks.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
                            >
                                <Droplets className="w-4 h-4" />
                                Add Dip Reading
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tanks.map((tank) => {
                        const percentage = Math.round((tank.currentLevel / tank.capacity) * 100);
                        const isLow = tank.currentLevel <= tank.minimumLevel;

                        return (
                            <Card key={tank._id} className={`p-6 ${isLow ? 'border-red-200 ring-1 ring-red-100' : ''}`}>
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${getFuelColor(tank.fuelType)}`}>
                                            <Fuel className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{tank.fuelType.toUpperCase()}</h3>
                                            <p className="text-sm text-slate-500 font-medium">Tank-{tank.tankNumber}</p>
                                        </div>
                                    </div>
                                    <Badge className={isLow ? "bg-red-100 text-red-700 border-red-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}>
                                        {isLow ? "Critical Level" : "Good"}
                                    </Badge>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-sm font-medium mb-2">
                                        <span className="text-slate-600">Fuel Level</span>
                                        <span className="text-slate-900">{percentage}%</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${getProgressBarColor(percentage, tank.fuelType)}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Current Stock</p>
                                        <p className="text-xl font-bold text-slate-900">{tank.currentLevel.toLocaleString()} L</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Capacity</p>
                                        <p className="text-xl font-bold text-slate-900">{tank.capacity.toLocaleString()} L</p>
                                    </div>
                                </div>

                                {isLow && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium mb-6">
                                        <AlertTriangle className="w-4 h-4" />
                                        Critical Level! Immediate restock required.
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                                    <div className="text-xs text-slate-500">
                                        Last dip reading: {tank.lastDipReading?.date ? new Date(tank.lastDipReading.date).toLocaleString() : 'Never'}
                                    </div>
                                    <button
                                        onClick={() => openHistoryModal(tank)}
                                        className="text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors"
                                    >
                                        View History
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Create Tank Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">Add New Tank</h3>
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
                                    Tank Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createForm.tankNumber}
                                    onChange={(e) => setCreateForm({ ...createForm, tankNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g. 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Fuel Type
                                </label>
                                <select
                                    required
                                    value={createForm.fuelType}
                                    onChange={(e) => setCreateForm({ ...createForm, fuelType: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="petrol">Petrol</option>
                                    <option value="diesel">Diesel</option>
                                    <option value="cng">CNG</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Capacity (Liters)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={createForm.capacity}
                                    onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g. 20000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Minimum Level Alert (Liters)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={createForm.minimumLevel}
                                    onChange={(e) => setCreateForm({ ...createForm, minimumLevel: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g. 2000"
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
                                    Create Tank
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Dip Reading Modal */}
            {showDipModal && selectedTank && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">Add Dip Reading</h3>
                            <button
                                onClick={() => setShowDipModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleDipSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Select Tank
                                </label>
                                <select
                                    value={selectedTank._id}
                                    onChange={(e) => setSelectedTank(tanks.find(t => t._id === e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    {tanks.map(t => (
                                        <option key={t._id} value={t._id}>
                                            {t.fuelType} - Tank {t.tankNumber}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Current Reading (Liters)
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max={selectedTank.capacity}
                                    value={dipForm.reading}
                                    onChange={(e) => setDipForm({ ...dipForm, reading: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Enter current level in liters"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Max Capacity: {selectedTank.capacity.toLocaleString()} L
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDipModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Save Reading
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && selectedTank && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Dip Reading History</h3>
                                <p className="text-sm text-slate-500">{selectedTank.fuelType} - Tank {selectedTank.tankNumber}</p>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-0 overflow-auto flex-1">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reading (L)</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Recorded By</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {selectedTank.dipReadings && selectedTank.dipReadings.length > 0 ? (
                                        [...selectedTank.dipReadings].reverse().map((reading, index) => (
                                            <tr key={index} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    {new Date(reading.date).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {reading.reading.toLocaleString()} L
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {reading.recordedBy?.username || 'System'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-12 text-center text-slate-500">
                                                No history available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}