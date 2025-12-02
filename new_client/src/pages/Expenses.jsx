
import React, { useState, useEffect } from "react";
import { transactionService } from "../services/transactionService";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';
import { Card } from "../components/ui/Card";
import {
    Plus,
    Calendar,
    PieChart,
    TrendingUp,
    DollarSign,
    Search,
    Filter,
    Download
} from "lucide-react";
import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

export default function Expenses() {
    const [activeTab, setActiveTab] = useState("add"); // 'add', 'history', 'analysis'
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        category: "Salary",
        amount: "",
        paymentMethod: "cash",
        date: new Date().toISOString().split('T')[0],
        description: ""
    });

    const categories = ["Salary", "Electricity", "Maintenance", "Rent", "Other"];
    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await transactionService.getAll();
            const allTransactions = response.data.data || [];
            const expenseTransactions = allTransactions.filter(t => t.type === 'expense');
            setExpenses(expenseTransactions);
        } catch (error) {
            console.error("Error fetching expenses:", error);
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
                type: "expense",
                category: formData.category,
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                date: formData.date,
                description: formData.description,
                createdBy: "67446e0692f0267756783a54" // TODO: Get from auth context
            };

            await transactionService.create(payload);
            toast.success("Expense recorded successfully!");
            setFormData({
                category: "Salary",
                amount: "",
                paymentMethod: "cash",
                date: new Date().toISOString().split('T')[0],
                description: ""
            });
            fetchData();
            setActiveTab("history");
        } catch (error) {
            console.error("Error creating expense:", error);
            toast.error(error.response?.data?.message || "Error creating expense");
        }
    };

    // Analysis Data Preparation
    const getCategoryData = () => {
        const data = {};
        expenses.forEach(e => {
            const cat = e.category || "Other";
            data[cat] = (data[cat] || 0) + e.amount;
        });
        return Object.keys(data).map(name => ({ name, value: data[name] }));
    };

    const getMonthlyTrend = () => {
        const data = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        expenses.forEach(e => {
            const date = new Date(e.date);
            const month = months[date.getMonth()];
            data[month] = (data[month] || 0) + e.amount;
        });

        // Sort by month order for current year or just return available data
        // For simplicity, returning all months that have data
        return Object.keys(data).map(name => ({ name, amount: data[name] }));
    };

    const filteredExpenses = expenses.filter(e =>
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (loading && !expenses.length) {
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
                                Expense Management
                            </h1>
                            <p className="text-sm text-slate-600 mt-1">Track and analyze expenses</p>
                        </div>
                        <button
                            onClick={() => setActiveTab("add")}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Expense
                        </button>
                    </div>

                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                        <button
                            onClick={() => setActiveTab("add")}
                            className={`px - 4 py - 2 rounded - lg font - medium transition - colors ${activeTab === "add"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                } `}
                        >
                            Add Expense
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px - 4 py - 2 rounded - lg font - medium transition - colors ${activeTab === "history"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                } `}
                        >
                            Expense History
                        </button>
                        <button
                            onClick={() => setActiveTab("analysis")}
                            className={`px - 4 py - 2 rounded - lg font - medium transition - colors ${activeTab === "analysis"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                } `}
                        >
                            Analysis
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {activeTab === "add" && (
                    <Card className="max-w-4xl mx-auto">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-semibold text-slate-900">Record New Expense</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Expense Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {categories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        placeholder="Enter amount"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                                    <select
                                        name="paymentMethod"
                                        value={formData.paymentMethod}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    placeholder="Expense details..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Record Expense
                            </button>
                        </form>
                    </Card>
                )}

                {activeTab === "history" && (
                    <Card className="overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">Expense History</h3>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search expenses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expense ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {filteredExpenses.length > 0 ? (
                                        filteredExpenses.map((expense) => (
                                            <tr key={expense._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                    {expense.transactionId}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium border border-slate-200">
                                                        {expense.category || 'Other'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {expense.description || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                                    ₹{expense.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                No expenses found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {activeTab === "analysis" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-6">Expense by Category</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={getCategoryData()}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ₹${value / 1000} k`}
                                        >
                                            {getCategoryData().map((entry, index) => (
                                                <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()} `} />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-6">Monthly Expense Trend</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getMonthlyTrend()}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()} `} />
                                        <Line
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }}
                                            name="Expenses (₹)"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
