import React, { useState, useEffect } from "react";
import { purchaseService } from "../services/purchaseService";
import { supplierService } from "../services/supplierService";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { toast } from 'react-toastify';
import {
    Search,
    Filter,
    Download,
    Plus,
    X,
    Edit,
    Trash2,
    ShoppingCart,
    Calendar,
    FileText,
    CheckCircle,
    Clock
} from "lucide-react";

export default function Purchases() {
    const [activeTab, setActiveTab] = useState("record"); // 'record' or 'history'
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        supplierId: "",
        itemType: "Petrol",
        quantity: "",
        unitPrice: "",
        invoiceNumber: "",
        paymentStatus: "paid",
        notes: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [purchaseRes, supplierRes] = await Promise.all([
                purchaseService.getAll(),
                supplierService.getAll()
            ]);
            setPurchases(purchaseRes.data.data || []);
            setSuppliers(supplierRes.data.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                supplierId: formData.supplierId,
                date: new Date(),
                items: [{
                    itemName: formData.itemType,
                    quantity: parseFloat(formData.quantity),
                    unitPrice: parseFloat(formData.unitPrice)
                }],
                invoiceNumber: formData.invoiceNumber,
                paymentStatus: formData.paymentStatus,
                notes: formData.notes
            };
            // console.log(payload);
            await purchaseService.create(payload);
            toast.success("Purchase recorded successfully!");
            setFormData({
                supplierId: "",
                itemType: "Petrol",
                quantity: "",
                unitPrice: "",
                invoiceNumber: "",
                paymentStatus: "paid",
                notes: ""
            });
            fetchData();
            setActiveTab("history");
        } catch (error) {
            console.error("Error creating purchase:", error);
            toast.error(error.response?.data?.message || "Error creating purchase");
        }
    };

    const getFilteredPurchases = () => {
        if (!searchTerm) return purchases;
        const lowerTerm = searchTerm.toLowerCase();
        return purchases.filter(p =>
            p.purchaseId?.toLowerCase().includes(lowerTerm) ||
            p.invoiceNumber?.toLowerCase().includes(lowerTerm) ||
            p.supplierId?.name?.toLowerCase().includes(lowerTerm)
        );
    };

    const filteredPurchases = getFilteredPurchases();

    // console.log(filteredPurchases);

    if (loading && !purchases.length && !suppliers.length) {
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
                            <h1 className="text-slate-900 flex items-center gap-2 text-2xl font-bold">
                                Purchase Management
                            </h1>
                            <p className="text-sm text-slate-600 mt-1">Record and track purchases</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab("record")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "record"
                                ? "bg-orange-100 text-orange-700"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            Record Purchase
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "history"
                                ? "bg-orange-100 text-orange-700"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            Purchase History
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {activeTab === "record" ? (
                    <Card className="max-w-4xl mx-auto">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-900">New Purchase Entry</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                                    <select
                                        name="supplierId"
                                        value={formData.supplierId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.name} ({s.companyName})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Type</label>
                                    <select
                                        name="itemType"
                                        value={formData.itemType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="Petrol">Petrol</option>
                                        <option value="Diesel">Diesel</option>
                                        <option value="CNG">CNG</option>
                                        <option value="Lubricant">Lubricant</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        name="quantity"
                                        value={formData.quantity}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        placeholder="Enter quantity"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Rate per Unit</label>
                                    <input
                                        type="number"
                                        name="unitPrice"
                                        value={formData.unitPrice}
                                        onChange={handleInputChange}
                                        required
                                        step="any"
                                        min="0"
                                        placeholder="Enter rate"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Number</label>
                                    <input
                                        type="text"
                                        name="invoiceNumber"
                                        value={formData.invoiceNumber}
                                        onChange={handleInputChange}
                                        placeholder="Enter invoice number"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Status</label>
                                    <select
                                        name="paymentStatus"
                                        value={formData.paymentStatus}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="partial">Partial</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Any additional notes..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Record Purchase
                            </button>
                        </form>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search purchases..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Purchase ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Supplier</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {filteredPurchases.length > 0 ? (
                                        filteredPurchases.map((purchase) => (
                                            <tr key={purchase._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    {new Date(purchase.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {purchase.purchaseId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {purchase.supplierId.name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {purchase.items[0]?.itemName}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {purchase.items[0]?.quantity}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    ₹{purchase.totalAmount?.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {purchase.paymentStatus === 'paid' ? (
                                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Paid</Badge>
                                                    ) : purchase.paymentStatus === 'pending' ? (
                                                        <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pending</Badge>
                                                    ) : (
                                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">Partial</Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                                No purchases found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
