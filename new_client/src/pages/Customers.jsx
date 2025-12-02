import React, { useState, useEffect } from "react";
import { customerService } from "../services/customerService";
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
    FileText,
    Send,
    Edit,
    Trash2,
    X,
    Phone,
    Mail,
    Building
} from "lucide-react";

export default function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all"); // all, credit, overdue
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        saleType: "credit",
        creditLimit: "",
        companyName: "",
        gstNumber: "",
        address: {
            street: "",
            city: "",
            state: "",
            zipCode: ""
        }
    });


    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await customerService.getAll();
            setCustomers(res.data.data || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await customerService.create(formData);
            setShowCreateModal(false);
            fetchCustomers();
            setFormData({
                name: "",
                phone: "", // Changed from contactNumber
                email: "",
                saleType: "credit",
                creditLimit: "",
                companyName: "",
                gstNumber: "",
                address: {
                    street: "",
                    city: "",
                    state: "",
                    zipCode: ""
                }
            });
            toast.success("Customer created successfully!");
        } catch (error) {
            console.error("Error creating customer:", error);
            toast.error(error.response?.data?.message || "Error creating customer");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await customerService.update(selectedCustomer._id, formData);
            setShowEditModal(false);
            fetchCustomers();
            toast.success("Customer updated successfully!");
        } catch (error) {
            console.error("Error updating customer:", error);
            toast.error(error.response?.data?.message || "Error updating customer");
        }
    };

    const openEditModal = (customer) => {
        setSelectedCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            email: customer.email || "",
            saleType: customer.saleType,
            creditLimit: customer.creditLimit || "",
            companyName: customer.companyName || "",
            gstNumber: customer.gstNumber || "",
            address: {
                street: customer.address?.street || "",
                city: customer.address?.city || "",
                state: customer.address?.state || "",
                zipCode: customer.address?.zipCode || ""
            }
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: "",
            phone: "",
            email: "",
            saleType: "credit",
            creditLimit: "",
            companyName: "",
            gstNumber: "",
            address: {
                street: "",
                city: "",
                state: "",
                zipCode: ""
            }
        });
        setSelectedCustomer(null);
    };

    const getFilteredCustomers = () => {
        let filtered = customers;

        // Tab filtering
        if (activeTab === "credit") {
            filtered = filtered.filter(c => c.saleType === "credit");
        } else if (activeTab === "overdue") {
            filtered = filtered.filter(c => c.outstandingBalance > 0);
        }

        // Search filtering
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(lowerTerm) ||
                c.customerId?.toLowerCase().includes(lowerTerm) ||
                c.phone.includes(searchTerm) ||
                c.companyName?.toLowerCase().includes(lowerTerm)
            );
        }

        return filtered;
    };

    const filteredCustomers = getFilteredCustomers();
    const overdueCount = customers.filter(c => c.outstandingBalance > 0).length;

    if (loading && !customers.length) {
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
                        <div>
                            <div>
                                <h1 className="text-slate-900 flex items-center gap-2">
                                    Customer Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Manage customer accounts and credit</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Customer
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "all"
                                ? "bg-orange-100 text-orange-700"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            All Customers
                        </button>
                        <button
                            onClick={() => setActiveTab("credit")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "credit"
                                ? "bg-orange-100 text-orange-700"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            Credit Customers
                        </button>
                        <button
                            onClick={() => setActiveTab("overdue")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "overdue"
                                ? "bg-orange-100 text-orange-700"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            Overdue Customers
                            {overdueCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                    {overdueCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Filters & Actions */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search customers..."
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
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Content based on Tab */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    {activeTab === "all" && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Credit Limit</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Balance</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                        </>
                                    )}
                                    {activeTab === "credit" && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Credit Limit</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Outstanding</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Available Credit</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/4">Utilization</th>
                                        </>
                                    )}
                                    {activeTab === "overdue" && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount Due</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Days Overdue</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer) => {
                                        const utilization = customer.creditLimit > 0
                                            ? Math.min(Math.round((customer.outstandingBalance / customer.creditLimit) * 100), 100)
                                            : 0;

                                        const availableCredit = Math.max(customer.creditLimit - customer.outstandingBalance, 0);

                                        return (
                                            <tr key={customer._id} className="hover:bg-slate-50">
                                                {activeTab === "all" && (
                                                    <>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                            {customer.customerId}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-slate-900">{customer.companyName || customer.name}</div>
                                                            <div className="text-xs text-slate-500">{customer.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <Badge className={customer.saleType === 'credit' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-700 border-slate-200"}>
                                                                {customer.saleType === 'credit' ? 'Credit' : 'Cash'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                            {customer.phone}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                            ₹{customer.creditLimit?.toLocaleString() || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                            ₹{customer.outstandingBalance?.toLocaleString() || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <Badge className={customer.outstandingBalance > 0 ? "bg-red-100 text-red-700 border-red-200" : "bg-emerald-100 text-emerald-700 border-emerald-200"}>
                                                                {customer.outstandingBalance > 0 ? 'Overdue' : 'Active'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                onClick={() => openEditModal(customer)}
                                                                className="text-slate-600 hover:text-orange-600 transition-colors mr-3"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button className="text-slate-400 hover:text-slate-600 transition-colors">
                                                                <FileText className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </>
                                                )}

                                                {activeTab === "credit" && (
                                                    <>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                            {customer.companyName || customer.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                            ₹{customer.creditLimit?.toLocaleString() || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                            ₹{customer.outstandingBalance?.toLocaleString() || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                            ₹{availableCredit.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                                                    <div
                                                                        className={`h-full rounded-full ${utilization > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                                        style={{ width: `${utilization}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-slate-500 font-medium">{utilization}%</span>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}

                                                {activeTab === "overdue" && (
                                                    <>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                            {customer.companyName || customer.name}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                                            ₹{customer.outstandingBalance?.toLocaleString() || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                                            {/* Mocking days overdue as it's not in backend yet */}
                                                            {Math.floor(Math.random() * 30) + 1} days
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                            {customer.phone}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <div className="flex gap-2">
                                                                <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">
                                                                    <Send className="w-3 h-3" />
                                                                    Remind
                                                                </button>
                                                                <button className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50">
                                                                    <FileText className="w-3 h-3" />
                                                                    Statement
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                            No customers found
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
                                {showCreateModal ? "Add New Customer" : "Edit Customer"}
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
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                                    <h4 className="font-medium text-slate-900 border-b pb-2">Financial Details</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Sale Type</label>
                                        <select
                                            value={formData.saleType}
                                            onChange={(e) => setFormData({ ...formData, saleType: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="credit">Credit</option>
                                            <option value="cash">Cash</option>
                                            <option value="fleet">Fleet</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.creditLimit}
                                            onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                                        <input
                                            type="text"
                                            value={formData.gstNumber}
                                            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
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
                                    {showCreateModal ? "Create Customer" : "Update Customer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}