import React, { useState, useEffect } from "react";
import { customerService } from "../services/customerService";
import { transactionService } from "../services/transactionService";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Search,
    Filter,
    Download,
    Wallet,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    FileText,
    Phone,
    Mail,
    Clock,
    X
} from "lucide-react";

export default function Credit() {
    const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'statements', 'aging', 'collections'
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Statement Modal State
    const [showStatementModal, setShowStatementModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerTransactions, setCustomerTransactions] = useState([]);
    const [statementLoading, setStatementLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await customerService.getAll();
            setCustomers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewStatement = async (customer) => {
        setSelectedCustomer(customer);
        setShowStatementModal(true);
        setStatementLoading(true);
        try {
            const response = await transactionService.getAll();
            const allTransactions = response.data.data || [];
            // Filter transactions for this customer
            const filtered = allTransactions.filter(t =>
                t.customerId === customer._id || t.partyId === customer._id
            ).sort((a, b) => new Date(b.date) - new Date(a.date));
            setCustomerTransactions(filtered);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setStatementLoading(false);
        }
    };

    // Stats
    const totalCreditLimit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
    const totalUtilized = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
    const totalAvailable = totalCreditLimit - totalUtilized;
    const overdueAccounts = customers.filter(c => c.outstandingBalance > 0 && c.paymentTerms === 'immediate').length; // Simplified logic

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aging Logic (Simplified simulation)
    const getAgingData = () => {
        // In a real app, this would require transaction history analysis
        // Here we simulate it based on outstanding balance
        const total = totalUtilized || 1;
        return [
            { range: "0-30 Days", count: Math.floor(customers.length * 0.4), amount: total * 0.4, percentage: 40 },
            { range: "31-60 Days", count: Math.floor(customers.length * 0.3), amount: total * 0.3, percentage: 30 },
            { range: "61-90 Days", count: Math.floor(customers.length * 0.2), amount: total * 0.2, percentage: 20 },
            { range: "90+ Days", count: Math.floor(customers.length * 0.1), amount: total * 0.1, percentage: 10 },
        ];
    };

    const agingData = getAgingData();

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
                            <h1 className="text-slate-900 flex items-center gap-2 text-2xl font-bold">
                                Credit Management
                            </h1>
                            <p className="text-sm text-slate-600 mt-1">Manage customer credit and collections</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Credit Limit</p>
                                <p className="text-xl font-bold text-slate-900">₹{totalCreditLimit.toLocaleString()}</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Utilized</p>
                                <p className="text-xl font-bold text-slate-900">₹{totalUtilized.toLocaleString()}</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Available</p>
                                <p className="text-xl font-bold text-slate-900">₹{totalAvailable.toLocaleString()}</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Overdue Accounts</p>
                                <p className="text-xl font-bold text-slate-900">{overdueAccounts}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                        {['overview', 'statements', 'aging', 'collections'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${activeTab === tab
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                {tab === 'aging' ? 'Aging Report' : tab === 'statements' ? 'Customer Statements' : tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8">
                {activeTab === "overview" && (
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">Credit Overview</h3>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search customers..."
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
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Credit Limit</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Outstanding</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Available</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Utilization</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map((customer) => {
                                            const limit = customer.creditLimit || 0;
                                            const outstanding = customer.outstandingBalance || 0;
                                            const available = limit - outstanding;
                                            const utilization = limit > 0 ? (outstanding / limit) * 100 : 0;

                                            return (
                                                <tr key={customer._id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                                                        <div className="text-xs text-slate-500">{customer.companyName}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                        ₹{limit.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        ₹{outstanding.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                        ₹{available.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                        <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[100px]">
                                                            <div
                                                                className={`h-2.5 rounded-full ${utilization > 90 ? 'bg-red-600' : utilization > 75 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                                                style={{ width: `${Math.min(utilization, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-slate-500 mt-1 block">{utilization.toFixed(0)}%</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {utilization > 100 ? (
                                                            <Badge className="bg-red-100 text-red-700 border-red-200">Overdue</Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                                No customers found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === "statements" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCustomers.map(customer => (
                            <Card key={customer._id} className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{customer.name}</h3>
                                            <p className="text-xs text-slate-500">{customer.customerId}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-600">Outstanding:</span>
                                    <span className="text-sm font-bold text-slate-900">₹{(customer.outstandingBalance || 0).toLocaleString()}</span>
                                </div>
                                {customer.outstandingBalance > customer.creditLimit && (
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-sm text-red-600">Overdue:</span>
                                        <span className="text-sm font-bold text-red-600">₹{(customer.outstandingBalance - customer.creditLimit).toLocaleString()}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => handleViewStatement(customer)}
                                    className="w-full py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    View Statement
                                </button>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === "aging" && (
                    <Card className="overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">Aging Report</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Age Range</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Number of Accounts</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {agingData.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {item.range}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {item.count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                ₹{item.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-slate-200 rounded-full h-2.5 max-w-[150px]">
                                                        <div
                                                            className="h-2.5 rounded-full bg-blue-600"
                                                            style={{ width: `${item.percentage}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-slate-600">{item.percentage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === "collections" && (
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Collection Priority</h3>
                        <div className="space-y-4">
                            {filteredCustomers
                                .filter(c => c.outstandingBalance > 0)
                                .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
                                .map(customer => (
                                    <div key={customer._id} className="p-4 border border-red-100 bg-red-50 rounded-lg flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-slate-900">{customer.name}</h4>
                                            <div className="flex gap-4 mt-1">
                                                <p className="text-sm text-red-600 font-medium">Overdue: ₹{customer.outstandingBalance.toLocaleString()}</p>
                                                <p className="text-sm text-slate-500">Total Outstanding: ₹{customer.outstandingBalance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50">
                                                Contact
                                            </button>
                                            <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">
                                                Follow Up
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            {filteredCustomers.filter(c => c.outstandingBalance > 0).length === 0 && (
                                <p className="text-center text-slate-500 py-8">No collections pending.</p>
                            )}
                        </div>
                    </Card>
                )}
            </div>

            {/* Statement Modal */}
            {showStatementModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Statement: {selectedCustomer.name}</h3>
                                <p className="text-sm text-slate-500">{selectedCustomer.companyName} | {selectedCustomer.customerId}</p>
                            </div>
                            <button
                                onClick={() => setShowStatementModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-6">
                            {statementLoading ? (
                                <div className="flex justify-center py-12">
                                    <LoadingSpinner />
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Transaction ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {customerTransactions.length > 0 ? (
                                            customerTransactions.map(txn => (
                                                <tr key={txn._id} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {new Date(txn.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        {txn.transactionId}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge className={
                                                            txn.type === 'payment_received' ? 'bg-emerald-100 text-emerald-700' :
                                                                txn.type === 'sale' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                        }>
                                                            {txn.type.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {txn.description || '-'}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${txn.type === 'payment_received' ? 'text-emerald-600' : 'text-slate-900'
                                                        }`}>
                                                        {txn.type === 'payment_received' ? '-' : '+'}₹{txn.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                    No transactions found for this customer.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setShowStatementModal(false)}
                                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
