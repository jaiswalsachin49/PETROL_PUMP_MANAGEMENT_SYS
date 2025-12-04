
import React, { useState, useEffect } from "react";
import { transactionService } from "../services/transactionService";
import { customerService } from "../services/customerService";
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
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    FileText,
    CreditCard
} from "lucide-react";

export default function Transactions() {
    const [activeTab, setActiveTab] = useState("all"); // 'all', 'received', 'made'
    const [transactions, setTransactions] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [formData, setFormData] = useState({
        type: "payment_received", // 'payment_received', 'payment_made', 'expense'
        partyId: "", // customerId or supplierId
        amount: "",
        paymentMethod: "cash",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [txnRes, cusRes, supRes] = await Promise.all([
                transactionService.getAll(),
                customerService.getAll(),
                supplierService.getAll()
            ]);
            setTransactions(txnRes.data.data || []);
            setCustomers(cusRes.data.data || []);
            setSuppliers(supRes.data.data || []);
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
                type: formData.type,
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                description: formData.description,
                date: formData.date,
                createdBy: "67446e0692f0267756783a54" // TODO: Get from auth context
            };

            if (formData.type === 'payment_received') {
                payload.customerId = formData.partyId;
            } else if (formData.type === 'payment_made') {
                payload.supplierId = formData.partyId;
            }

            await transactionService.create(payload);
            toast.success("Transaction recorded successfully!");
            setShowCreateModal(false);
            setFormData({
                type: "payment_received",
                partyId: "",
                amount: "",
                paymentMethod: "cash",
                description: "",
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            console.error("Error creating transaction:", error);
            toast.error(error.response?.data?.message || "Error creating transaction");
        }
    };

    const getFilteredTransactions = () => {
        let filtered = transactions;

        // Tab filtering
        if (activeTab === "received") {
            filtered = filtered.filter(t => t.type === "payment_received");
        } else if (activeTab === "made") {
            filtered = filtered.filter(t => t.type === "payment_made" || t.type === "expense");
        }

        // Search filtering
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(t =>
                t.transactionId?.toLowerCase().includes(lowerTerm) ||
                t.description?.toLowerCase().includes(lowerTerm) ||
                (t.customerId && customers.find(c => c._id === t.customerId)?.name.toLowerCase().includes(lowerTerm)) ||
                (t.supplierId && suppliers.find(s => s._id === t.supplierId)?.name.toLowerCase().includes(lowerTerm))
            );
        }

        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const filteredTransactions = getFilteredTransactions();

    // Stats
    const totalReceived = transactions
        .filter(t => t.type === 'payment_received' || t.type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalPaid = transactions
        .filter(t => t.type === 'payment_made' || t.type === 'expense' || t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0);

    const netCashFlow = totalReceived - totalPaid;

    const getPartyName = (txn) => {
        if (txn.customerId) {
            // Check if customerId is populated (object) or just an ID (string)
            if (typeof txn.customerId === 'object' && txn.customerId.name) {
                return txn.customerId.name;
            }
            // If it's just an ID string, search in customers array
            const customer = customers.find(c => c._id.toString() === txn.customerId.toString());
            return customer?.name || 'Unknown Customer';
        }
        if (txn.supplierId) {
            // Check if supplierId is populated (object) or just an ID (string)
            if (typeof txn.supplierId === 'object' && txn.supplierId.name) {
                return txn.supplierId.name;
            }
            // If it's just an ID string, search in suppliers array
            const supplier = suppliers.find(s => s._id.toString() === txn.supplierId.toString());
            return supplier?.name || 'Unknown Supplier';
        }
        return '-';
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setActiveTab("all");
        toast.success("Filters reset");
    };

    const handleExportCSV = () => {
        if (!filteredTransactions.length) {
            toast.error("No transactions to export");
            return;
        }

        const headers = [
            "Transaction ID",
            "Date",
            "Type",
            "Party",
            "Amount",
            "Payment Method",
            "Description"
        ];

        const csvRows = [];
        csvRows.push(headers.join(","));

        filteredTransactions.forEach(txn => {
            const row = [
                txn.transactionId || '',
                new Date(txn.date).toLocaleDateString(),
                txn.type === 'payment_received' || txn.type === 'sale' ? 'Received' : 'Paid',
                getPartyName(txn),
                txn.amount || 0,
                txn.paymentMethod || '',
                txn.description || ''
            ];

            // Properly escape CSV fields
            const escapedRow = row.map(field => {
                const fieldStr = String(field);
                if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
                    return `"${fieldStr.replace(/"/g, '""')}"`;
                }
                return fieldStr;
            });

            csvRows.push(escapedRow.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(`Exported ${filteredTransactions.length} transactions to CSV`);
    };

    if (loading && !transactions.length) {
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
                                    Transaction Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Track all financial transactions</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Transaction
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Received</p>
                                <p className="text-2xl font-bold text-slate-900">₹{totalReceived.toLocaleString()}</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Paid</p>
                                <p className="text-2xl font-bold text-slate-900">₹{totalPaid.toLocaleString()}</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Net Cash Flow</p>
                                <p className={`text - 2xl font - bold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'} `}>
                                    ₹{netCashFlow.toLocaleString()}
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "all"
                                ? "bg-orange-100 text-orange-700 shadow-sm"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            All Transactions
                        </button>
                        <button
                            onClick={() => setActiveTab("received")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "received"
                                ? "bg-orange-100 text-orange-700 shadow-sm"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            Payments Received
                        </button>
                        <button
                            onClick={() => setActiveTab("made")}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "made"
                                ? "bg-orange-100 text-orange-700 shadow-sm"
                                : "text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            Payments Made
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleResetFilters}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                <Filter className="w-4 h-4" />
                                Reset Filters
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Party</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((txn) => (
                                        <tr key={txn._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {txn.transactionId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {new Date(txn.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {txn.type === 'payment_received' || txn.type === 'sale' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Received</Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 border-red-200">Paid</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {getPartyName(txn)}
                                            </td>
                                            <td className={`px - 6 py - 4 whitespace - nowrap text - sm font - medium ${txn.type === 'payment_received' || txn.type === 'sale' ? 'text-emerald-600' : 'text-red-600'
                                                } `}>
                                                {txn.type === 'payment_received' || txn.type === 'sale' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 capitalize">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium border border-slate-200">
                                                    {txn.paymentMethod.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {txn.description || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">Add New Transaction</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Transaction Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="payment_received">Payment Received</option>
                                    <option value="payment_made">Payment Made</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>

                            {formData.type !== 'expense' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {formData.type === 'payment_received' ? 'Received From' : 'Paid To'}
                                    </label>
                                    <select
                                        name="partyId"
                                        value={formData.partyId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="">Select Party</option>
                                        {formData.type === 'payment_received' ? (
                                            customers.map(c => (
                                                <option key={c._id} value={c._id}>{c.name} ({c.companyName || 'Individual'})</option>
                                            ))
                                        ) : (
                                            suppliers.map(s => (
                                                <option key={s._id} value={s._id}>{s.name} ({s.companyName})</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Record Transaction
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
