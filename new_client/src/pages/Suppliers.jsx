import React, { useState, useEffect } from "react";
import { supplierService } from "../services/supplierService";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Search,
    Filter,
    Download,
    Plus,
    X,
    Edit,
    Trash2,
    Truck,
    Droplet,
    Wrench,
    Package
} from "lucide-react";

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        companyName: "",
        email: "",
        phone: "",
        supplierType: "fuel",
        gstNumber: "",
        address: {
            street: "",
            city: "",
            state: "",
            zipCode: ""
        },
        paymentTerms: "immediate",
        isActive: true
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const res = await supplierService.getAll();
            setSuppliers(res.data.data || []);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await supplierService.create(formData);
            setShowCreateModal(false);
            resetForm();
            fetchSuppliers();
            toast.success("Supplier created successfully!");
        } catch (error) {
            console.error("Error creating supplier:", error);
            toast.error(error.response?.data?.message || "Error creating supplier");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await supplierService.update(selectedSupplier._id, formData);
            setShowEditModal(false);
            resetForm();
            fetchSuppliers();
            toast.success("Supplier updated successfully!");
        } catch (error) {
            console.error("Error updating supplier:", error);
            toast.error(error.response?.data?.message || "Error updating supplier");
        }
    };

    const openEditModal = (supplier) => {
        setSelectedSupplier(supplier);
        setFormData({
            name: supplier.name,
            companyName: supplier.companyName || "",
            email: supplier.email || "",
            phone: supplier.phone,
            supplierType: supplier.supplierType,
            gstNumber: supplier.gstNumber || "",
            address: {
                street: supplier.address?.street || "",
                city: supplier.address?.city || "",
                state: supplier.address?.state || "",
                zipCode: supplier.address?.zipCode || ""
            },
            paymentTerms: supplier.paymentTerms || "immediate",
            isActive: supplier.isActive
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            companyName: "",
            email: "",
            phone: "",
            supplierType: "fuel",
            gstNumber: "",
            address: {
                street: "",
                city: "",
                state: "",
                zipCode: ""
            },
            paymentTerms: "immediate",
            isActive: true
        });
        setSelectedSupplier(null);
    };

    const getFilteredSuppliers = () => {
        if (!searchTerm) return suppliers;
        const lowerTerm = searchTerm.toLowerCase();
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(lowerTerm) ||
            s.supplierId?.toLowerCase().includes(lowerTerm) ||
            s.phone.includes(searchTerm) ||
            s.companyName?.toLowerCase().includes(lowerTerm)
        );
    };

    const filteredSuppliers = getFilteredSuppliers();

    const getSupplierTypeBadge = (type) => {
        switch (type) {
            case 'fuel': return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Fuel Supplier</Badge>;
            case 'lubricant': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Lubricants</Badge>;
            case 'accessories': return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Accessories</Badge>;
            default: return <Badge className="bg-slate-100 text-slate-700 border-slate-200">General</Badge>;
        }
    };

    const handleExportCSV =()=>{
        if(!suppliers.length){
            toast.error("No suppliers to export");
            return;
        }
        const header = [ 
            "Supplier ID",
            "Name",
            "Company Name",
            "Email",
            "Phone",
            "Supplier Type",
            "GST Number",
            "Payment Terms",
            "Is Active"
        ]
        const csvRows = []
        csvRows.push(header.join(","))
        suppliers.forEach(supplier => {
            const row = [
                supplier.supplierId,
                supplier.name,
                supplier.companyName,
                supplier.email,
                supplier.phone,
                supplier.supplierType,
                supplier.gstNumber,
                supplier.paymentTerms,
                supplier.isActive
            ]
            csvRows.push(row.join(","))
        })
        const csvContent = csvRows.join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "suppliers.csv"
        link.click()
        URL.revokeObjectURL(url)
    }

    if (loading && !suppliers.length) {
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
                                    Supplier Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Manage fuel and equipment suppliers</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Supplier
                        </button>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex items-center justify-between">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search suppliers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                                <Filter className="w-4 h-4" />
                                Filter
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors" onClick={handleExportCSV}>
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredSuppliers.length > 0 ? (
                                    filteredSuppliers.map((supplier) => (
                                        <tr key={supplier._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {supplier.supplierId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900">{supplier.companyName || supplier.name}</div>
                                                {supplier.companyName && <div className="text-xs text-slate-500">{supplier.name}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getSupplierTypeBadge(supplier.supplierType)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {supplier.phone}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {supplier.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge className={supplier.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-red-100 text-red-700 border-red-200"}>
                                                    {supplier.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(supplier)}
                                                    className="text-slate-600 hover:text-orange-600 transition-colors mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button className="text-slate-400 hover:text-orange-600 transition-colors">
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            No suppliers found
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
                                {showCreateModal ? "Add New Supplier" : "Edit Supplier"}
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
                                    <h4 className="font-medium text-slate-900 border-b pb-2">Basic Information</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                            placeholder="e.g. Indian Oil Corporation"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-medium text-slate-900 border-b pb-2">Business Details</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Type</label>
                                        <select
                                            value={formData.supplierType}
                                            onChange={(e) => setFormData({ ...formData, supplierType: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="fuel">Fuel Supplier</option>
                                            <option value="lubricant">Lubricants</option>
                                            <option value="accessories">Accessories</option>
                                            <option value="general">General</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                                        <input
                                            type="text"
                                            value={formData.gstNumber}
                                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms</label>
                                        <select
                                            value={formData.paymentTerms}
                                            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="immediate">Immediate</option>
                                            <option value="net15">Net 15</option>
                                            <option value="net30">Net 30</option>
                                            <option value="net60">Net 60</option>
                                        </select>
                                    </div>

                                    {!showCreateModal && (
                                        <div className="flex items-center gap-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active Supplier</label>
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
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={formData.address.city}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            value={formData.address.state}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    {showCreateModal ? "Create Supplier" : "Update Supplier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
