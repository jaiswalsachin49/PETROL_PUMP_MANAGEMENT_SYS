import React, { useState, useEffect } from "react";
import { employeeService } from "../services/employeeService";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Search,
    Filter,
    Download,
    Plus,
    MoreVertical,
    User,
    Phone,
    Mail,
    Briefcase,
    DollarSign,
    Calendar,
    X,
    Edit,
    Trash2
} from "lucide-react";

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        position: "pump_attendant",
        salary: "",
        joiningDate: new Date().toISOString().split('T')[0],
        address: {
            street: "",
            city: "",
            state: "",
            zipCode: ""
        },
        isActive: true
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await employeeService.getAll();
            setEmployees(res.data.data || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await employeeService.create(formData);
            setShowCreateModal(false);
            resetForm();
            fetchEmployees();
            toast.success("Employee created successfully!");
        } catch (error) {
            console.error("Error creating employee:", error);
            toast.error(error.response?.data?.message || "Error creating employee");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await employeeService.update(selectedEmployee._id, formData);
            setShowEditModal(false);
            resetForm();
            fetchEmployees();
            toast.success("Employee updated successfully!");
        } catch (error) {
            console.error("Error updating employee:", error);
            toast.error(error.response?.data?.message || "Error updating employee");
        }
    };

    const openEditModal = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            name: employee.name,
            phone: employee.phone,
            email: employee.email || "",
            position: employee.position,
            salary: employee.salary || "",
            joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : "",
            address: {
                street: employee.address?.street || "",
                city: employee.address?.city || "",
                state: employee.address?.state || "",
                zipCode: employee.address?.zipCode || ""
            },
            isActive: employee.isActive
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            email: "",
            position: "pump_attendant",
            salary: "",
            joiningDate: new Date().toISOString().split('T')[0],
            address: {
                street: "",
                city: "",
                state: "",
                zipCode: ""
            },
            isActive: true
        });
        setSelectedEmployee(null);
    };

    const getFilteredEmployees = () => {
        if (!searchTerm) return employees;
        const lowerTerm = searchTerm.toLowerCase();
        return employees.filter(e =>
            e.name.toLowerCase().includes(lowerTerm) ||
            e.employeeId?.toLowerCase().includes(lowerTerm) ||
            e.phone.includes(searchTerm) ||
            e.position.toLowerCase().includes(lowerTerm)
        );
    };

    const handleDeleteClick = (employee) => {
        setDeleteTarget(employee);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            await employeeService.delete(deleteTarget._id);
            setShowDeleteModal(false);
            setDeleteTarget(null);
            fetchEmployees();
            toast.success("Employee deleted successfully!");
        } catch (error) {
            console.error("Error deleting employee:", error);
            toast.error(error.response?.data?.message || "Error deleting employee");
        }
    };

    const filteredEmployees = getFilteredEmployees();

    const formatPosition = (pos) => {
        return pos.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const heandleExportCSV = () =>{
        if(!employees.length){
            toast.error("No data to export");
            return;
        }

        const headers = [
            "Employee ID",
            "Name",
            "Phone",
            "Email",
            "Position",
            "Salary",
            "Joining Date",
            "Is Active"
        ];
        const csvRow = []
        csvRow.push(headers.join(","));
        employees.forEach(employee => {
            const row = [
                employee.employeeId,
                employee.name,
                employee.phone,
                employee.email,
                employee.position,
                employee.salary,
                employee.joiningDate,
                employee.isActive
            ];
            csvRow.push(row.join(","));
        });
        const csvContent = csvRow.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "employees.csv");
        link.click();
        URL.revokeObjectURL(url);
    }

    if (loading && !employees.length) {
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
                    <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div>
                                <h1 className="text-slate-900 flex items-center gap-2">
                                    Employee Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Manage employee records and payroll</p>
                                </div>
                            </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Employee
                        </button>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex items-center justify-between">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                                <Filter className="w-4 h-4" />
                                Filter
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors" onClick={heandleExportCSV}>
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employee ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Salary</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Join Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((employee) => (
                                        <tr key={employee._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {employee.employeeId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                                        {employee.name.charAt(0)}
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-900">{employee.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                                                    {formatPosition(employee.position)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {employee.phone}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                ₹{employee.salary?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {new Date(employee.joiningDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={employee.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}>
                                                    {employee.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(employee)}
                                                    className="text-orange-600 hover:text-orange-700 transition-colors mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(employee)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete employee"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                            No employees found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {showCreateModal ? "Add New Employee" : "Edit Employee"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowEditModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={showCreateModal ? handleCreateSubmit : handleEditSubmit} className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-slate-900 border-b pb-2">Personal Information</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-medium text-slate-900 border-b pb-2">Employment Details</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                                        <select
                                            value={formData.position}
                                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="pump_attendant">Pump Attendant</option>
                                            <option value="manager">Manager</option>
                                            <option value="accountant">Accountant</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="cashier">Cashier</option>
                                            <option value="helper">Helper</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Salary (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.salary}
                                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                                        <input
                                            type="date"
                                            value={formData.joiningDate}
                                            onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>

                                    {!showCreateModal && (
                                        <div className="flex items-center gap-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-4 h-4 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
                                            />
                                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active Employee</label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <h4 className="font-medium text-slate-900 border-b pb-2">Address</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                                        <input
                                            type="text"
                                            value={formData.address.street}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={formData.address.state}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setShowEditModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    {showCreateModal ? "Create Employee" : "Update Employee"}
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
                            <h3 className="text-lg font-semibold text-red-900">Delete Employee</h3>
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
                                <User className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-red-900">Warning</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        This action cannot be undone. The employee record will be permanently deleted.
                                    </p>
                                </div>
                            </div>

                            {/* Employee Details */}
                            <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                                <h4 className="text-sm font-medium text-slate-900">Employee Details:</h4>
                                <div className="text-sm text-slate-700 space-y-1">
                                    <p><span className="font-medium">Name:</span> {deleteTarget.name}</p>
                                    <p><span className="font-medium">Employee ID:</span> {deleteTarget.employeeId}</p>
                                    <p><span className="font-medium">Position:</span> {formatPosition(deleteTarget.position)}</p>
                                    <p><span className="font-medium">Phone:</span> {deleteTarget.phone}</p>
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
                                    Delete Employee
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}