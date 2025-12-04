import React, { useState, useEffect } from "react";
import { reportService } from "../services/reportService";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { toast } from 'react-toastify';
import {
    FileText,
    Download,
    Filter,
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    BarChart3
} from "lucide-react";
import * as XLSX from 'xlsx';

export default function AnalyticsReports() {
    const [activeTab, setActiveTab] = useState("sales"); // 'sales', 'financial', 'inventory'
    const [loading, setLoading] = useState(false);

    // Sales Report State
    const [salesData, setSalesData] = useState([]);
    const [dateRange, setDateRange] = useState({
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });
    const [selectedShift, setSelectedShift] = useState("All Shifts");

    // Financial Report State
    const [financialData, setFinancialData] = useState(null);

    // Inventory Report State
    const [inventoryData, setInventoryData] = useState([]);

    useEffect(() => {
        if (activeTab === 'sales') fetchSalesReport();
        if (activeTab === 'financial') fetchFinancialReport();
        if (activeTab === 'inventory') fetchInventoryReport();
    }, [activeTab]);

    const fetchSalesReport = async () => {
        try {
            setLoading(true);
            const response = await reportService.getSalesReport({
                startDate: dateRange.from,
                endDate: dateRange.to,
                shift: selectedShift === "All Shifts" ? undefined : selectedShift
            });
            setSalesData(response.data.data || []);
        } catch (error) {
            console.error("Error fetching sales report:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFinancialReport = async () => {
        try {
            setLoading(true);
            const response = await reportService.getFinancialReport();
            setFinancialData(response.data.data);
        } catch (error) {
            console.error("Error fetching financial report:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventoryReport = async () => {
        try {
            setLoading(true);
            const response = await reportService.getFuelInventoryReport();
            setInventoryData(response.data.data || []);
        } catch (error) {
            console.error("Error fetching inventory report:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (activeTab === 'sales' && !salesData.length) {
            toast.error("No sales data to export");
            return;
        }

        let dataToExport = [];
        let fileName = "report";

        if (activeTab === 'sales') {
            dataToExport = salesData;
            fileName = "Sales_Report";
        } else if (activeTab === 'inventory') {
            dataToExport = inventoryData;
            fileName = "Inventory_Report";
        } else if (activeTab === 'financial' && financialData) {
            dataToExport = [financialData];
            fileName = "Financial_Report";
        }

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast.success(`Exported ${fileName} successfully!`);
    };

    const handleResetFilters = () => {
        setDateRange({
            from: new Date().toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
        });
        setSelectedShift("All Shifts");
        toast.success("Filters reset");
    };

    const handleExportCSV = () => {
        if (activeTab === 'sales' && !salesData.length) {
            toast.error("No sales data to export");
            return;
        }
        if (activeTab === 'inventory' && !inventoryData.length) {
            toast.error("No inventory data to export");
            return;
        }
        if (activeTab === 'financial' && !financialData) {
            toast.error("No financial data to export");
            return;
        }
        let dataToExport = [];
        let fileName = "report";
        let headers = [];

        if (activeTab === 'sales') {
            if (!salesData.length) {
                toast.error("No sales data to export");
                return;
            }
            fileName = "Sales_Report";
            headers = ["Date", "Shift", "Petrol (L)", "Diesel (L)", "Total (L)", "Revenue"];

            const csvRows = [];
            csvRows.push(headers.join(","));

            salesData.forEach(row => {
                const rowData = [
                    row.date || '',
                    row.shift || '',
                    row.petrol || 0,
                    row.diesel || 0,
                    row.total || 0,
                    row.revenue || 0
                ];
                csvRows.push(rowData.join(","));
            });

            // Add total row
            const totalRow = [
                "Total",
                "",
                salesData.reduce((sum, r) => sum + (r.petrol || 0), 0),
                salesData.reduce((sum, r) => sum + (r.diesel || 0), 0),
                salesData.reduce((sum, r) => sum + (r.total || 0), 0),
                salesData.reduce((sum, r) => sum + (r.revenue || 0), 0)
            ];
            csvRows.push(totalRow.join(","));

            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success(`Exported ${salesData.length} sales records to CSV`);
        } else if (activeTab === 'inventory') {
            if (!inventoryData.length) {
                toast.error("No inventory data to export");
                return;
            }
            fileName = "Inventory_Report";
            headers = ["Item", "Opening Stock", "Purchases", "Sales", "Closing Stock"];

            const csvRows = [];
            csvRows.push(headers.join(","));

            inventoryData.forEach(item => {
                const rowData = [
                    item.item || '',
                    item.openingStock || 0,
                    item.purchases || 0,
                    item.sales || 0,
                    item.closingStock || 0
                ];
                csvRows.push(rowData.join(","));
            });

            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success(`Exported ${inventoryData.length} inventory items to CSV`);
        } else if (activeTab === 'financial' && financialData) {
            fileName = "Financial_Report";

            const csvRows = [];
            csvRows.push("Metric,Amount");
            csvRows.push(`Total Income,${financialData.totalIncome || 0}`);
            csvRows.push(`Total Expenses,${financialData.totalExpenses || 0}`);
            csvRows.push(`Net Profit,${financialData.netProfit || 0}`);

            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success("Exported financial report to CSV");
        } else {
            toast.error("No data to export");
        }
    };

    return (
        <div className="flex-1 bg-slate-50 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-slate-900 flex items-center gap-2">
                                Analytics Reports
                                <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            </h1>
                            <p className="text-sm text-slate-600 mt-1">Manage customer credit and collections</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                        {[
                            { id: 'sales', label: 'Sales Reports' },
                            { id: 'financial', label: 'Financial Reports' },
                            { id: 'inventory', label: 'Inventory Reports' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                    ? "bg-orange-100 text-orange-700 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Sales Report */}
                {activeTab === 'sales' && (
                    <Card className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Sales Report</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleResetFilters}
                                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                    <Filter className="w-4 h-4" /> Reset Filters
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                    <FileText className="w-4 h-4" /> Export Excel
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">From Date</label>
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">To Date</label>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Shift</label>
                                <select
                                    value={selectedShift}
                                    onChange={(e) => setSelectedShift(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option>All Shifts</option>
                                    <option>Morning</option>
                                    <option>Night</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={fetchSalesReport}
                                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex justify-center py-12"><LoadingSpinner /></div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Shift</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Petrol (L)</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Diesel (L)</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Total (L)</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {salesData.length > 0 ? (
                                            salesData.map((row, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{row.date}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{row.shift}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{row.petrol?.toLocaleString() || 0}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{row.diesel?.toLocaleString() || 0}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{row.total?.toLocaleString() || 0}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">₹{row.revenue?.toLocaleString() || 0}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">No data available for selected range</td>
                                            </tr>
                                        )}
                                        {/* Total Row */}
                                        {salesData.length > 0 && (
                                            <tr className="bg-slate-50 font-bold">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">Total</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900"></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    {salesData.reduce((sum, r) => sum + (r.petrol || 0), 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    {salesData.reduce((sum, r) => sum + (r.diesel || 0), 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    {salesData.reduce((sum, r) => sum + (r.total || 0), 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                    ₹{salesData.reduce((sum, r) => sum + (r.revenue || 0), 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                )}

                {/* Financial Report */}
                {activeTab === 'financial' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Financial Report</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                    <FileText className="w-4 h-4" /> Export Excel
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12"><LoadingSpinner /></div>
                        ) : financialData ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="p-6 bg-emerald-50 border-emerald-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-emerald-100 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <h4 className="text-sm font-medium text-emerald-900">Total Income</h4>
                                    </div>
                                    <p className="text-3xl font-bold text-emerald-700">₹{financialData.totalIncome?.toLocaleString()}</p>
                                </Card>

                                <Card className="p-6 bg-red-50 border-red-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-red-100 rounded-lg">
                                            <TrendingDown className="w-6 h-6 text-red-600" />
                                        </div>
                                        <h4 className="text-sm font-medium text-red-900">Total Expenses</h4>
                                    </div>
                                    <p className="text-3xl font-bold text-red-700">₹{financialData.totalExpenses?.toLocaleString()}</p>
                                </Card>

                                <Card className="p-6 bg-blue-50 border-blue-100">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-100 rounded-lg">
                                            <DollarSign className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <h4 className="text-sm font-medium text-blue-900">Net Profit</h4>
                                    </div>
                                    <p className="text-3xl font-bold text-blue-700">₹{financialData.netProfit?.toLocaleString()}</p>
                                </Card>
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 py-12">No financial data available</p>
                        )}
                    </div>
                )}

                {/* Inventory Report */}
                {activeTab === 'inventory' && (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Inventory Report</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Export CSV
                                </button>
                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                    <FileText className="w-4 h-4" /> Export Excel
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="flex justify-center py-12"><LoadingSpinner /></div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Opening Stock</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Purchases</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sales</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Closing Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {inventoryData.length > 0 ? (
                                            inventoryData.map((item, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.item}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.openingStock?.toLocaleString()} L</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.purchases?.toLocaleString()} L</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{item.sales?.toLocaleString()} L</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.closingStock?.toLocaleString()} L</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">No inventory data available</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}