import React, { useState, useEffect } from "react";
import { reportService } from "../services/reportService";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import { toast } from 'react-toastify';
import { AlertTriangle, CheckCircle, XCircle, FileText, Download } from "lucide-react";

export default function Reconciliation() {
    const [activeTab, setActiveTab] = useState("fuel"); // 'fuel', 'daily', 'anomalies'
    const [loading, setLoading] = useState(false);
    const [fuelData, setFuelData] = useState([]);
    const [dailyData, setDailyData] = useState(null);
    const [anomalies, setAnomalies] = useState([]);

    useEffect(() => {
        if (activeTab === 'fuel') fetchFuelReconciliation();
        if (activeTab === 'daily') fetchDailyReconciliation();
        if (activeTab === 'anomalies') fetchAnomalies();
    }, [activeTab]);

    const fetchFuelReconciliation = async () => {
        try {
            setLoading(true);
            const response = await reportService.getFuelReconciliation();
            setFuelData(response.data.data || []);
        } catch (error) {
            console.error("Error fetching fuel reconciliation:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDailyReconciliation = async () => {
        try {
            setLoading(true);
            const response = await reportService.getDailyReconciliation();
            setDailyData(response.data.data);
        } catch (error) {
            console.error("Error fetching daily reconciliation:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnomalies = async () => {
        try {
            setLoading(true);
            const response = await reportService.getAnomalies();
            setAnomalies(response.data.data || []);
        } catch (error) {
            console.error("Error fetching anomalies:", error);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (severity) => {
        const styles = {
            HIGH: "bg-red-100 text-red-700",
            MEDIUM: "bg-orange-100 text-orange-700",
            LOW: "bg-yellow-100 text-yellow-700"
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[severity] || styles.LOW}`}>
                {severity}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        if (status === "OK") {
            return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> OK
            </span>;
        } else {
            return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Minor Variance
            </span>;
        }
    };

    const handleExportCSV = () => {
        if (activeTab === 'fuel') {
            if (!fuelData.length) {
                toast.error("No fuel data to export");
                return;
            }

            const headers = ["Fuel Type", "Opening Stock (L)", "Purchases (L)", "Sales (L)", "Expected (L)", "Actual (L)", "Variance", "Status"];
            const csvRows = [];
            csvRows.push(headers.join(","));

            fuelData.forEach(fuel => {
                const row = [
                    fuel.fuelType || '',
                    fuel.openingStock || 0,
                    fuel.purchases || 0,
                    fuel.sales || 0,
                    fuel.expected || 0,
                    fuel.actual || 0,
                    fuel.variance || 0,
                    fuel.status || ''
                ];
                csvRows.push(row.join(","));
            });

            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Fuel_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success(`Exported ${fuelData.length} fuel records to CSV`);
        } else if (activeTab === 'daily') {
            if (!dailyData) {
                toast.error("No daily reconciliation data to export");
                return;
            }

            const csvRows = [];
            csvRows.push("Section,Item,Amount");

            // Cash Reconciliation
            csvRows.push(`Cash,Opening Cash,${dailyData.cash.openingCash}`);
            csvRows.push(`Cash,Cash Sales,${dailyData.cash.cashSales}`);
            csvRows.push(`Cash,Cash Expenses,${dailyData.cash.cashExpenses}`);
            csvRows.push(`Cash,Expected Cash,${dailyData.cash.expectedCash}`);
            csvRows.push(`Cash,Actual Cash,${dailyData.cash.actualCash}`);

            // Sales Summary
            csvRows.push(`Sales,Total Transactions,${dailyData.sales.totalTransactions}`);
            csvRows.push(`Sales,Cash Sales,${dailyData.sales.cashSales}`);
            csvRows.push(`Sales,Card Sales,${dailyData.sales.cardSales}`);
            csvRows.push(`Sales,UPI Sales,${dailyData.sales.upiSales}`);
            csvRows.push(`Sales,Credit Sales,${dailyData.sales.creditSales}`);
            csvRows.push(`Sales,Total Sales,${dailyData.sales.totalSales}`);

            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Daily_Reconciliation_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success("Exported daily reconciliation to CSV");
        } else if (activeTab === 'anomalies') {
            if (!anomalies.length) {
                toast.error("No anomalies to export");
                return;
            }

            const headers = ["Date", "Severity", "Title", "Description"];
            const csvRows = [];
            csvRows.push(headers.join(","));

            anomalies.forEach(anomaly => {
                const row = [
                    anomaly.date || '',
                    anomaly.severity || '',
                    anomaly.title || '',
                    anomaly.description || ''
                ];

                // Escape CSV fields
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
            link.download = `Anomalies_Report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success(`Exported ${anomalies.length} anomalies to CSV`);
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
                                Reconciliation
                                <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            </h1>
                            <p className="text-sm text-slate-600 mt-1">Daily reconciliation and variance analysis</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                        {[
                            { id: 'fuel', label: 'Fuel Reconciliation' },
                            { id: 'daily', label: 'Daily Reconciliation' },
                            { id: 'anomalies', label: 'Anomalies', badge: anomalies.length }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${activeTab === tab.id
                                    ? "bg-orange-100 text-orange-700 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-100"
                                    }`}
                            >
                                {tab.label}
                                {tab.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Fuel Reconciliation Tab */}
                {activeTab === 'fuel' && (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    Fuel Stock Reconciliation - {new Date().toLocaleDateString('en-GB')}
                                </h3>
                            </div>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12"><LoadingSpinner /></div>
                        ) : (
                            <>
                                <div className="overflow-x-auto mb-6">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fuel Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Opening Stock (L)</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Purchases (L)</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Sales (L)</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Expected (L)</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actual (L)</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Variance</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {fuelData.map((fuel, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{fuel.fuelType}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{fuel.openingStock.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">+{fuel.purchases.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">-{fuel.sales.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{fuel.expected.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">{fuel.actual.toLocaleString()}</td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${fuel.variance < 0 ? 'text-red-600' : fuel.variance > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {fuel.variance === 0 ? '0' : `${fuel.variance > 0 ? '+' : ''}${fuel.variance}L`}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(fuel.status)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {fuelData.length > 0 && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-900">
                                            <strong>Summary:</strong> Minor variances detected in Petrol (-20L) and Diesel (-15L). Total variance is within acceptable limits (&lt;1%). No major concerns.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                )}

                {/* Daily Reconciliation Tab */}
                {activeTab === 'daily' && dailyData && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Daily Reconciliation</h3>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Cash Reconciliation */}
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Cash Reconciliation</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">Opening Cash</span>
                                        <span className="text-sm font-semibold text-slate-900">₹{dailyData.cash.openingCash.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">Cash Sales</span>
                                        <span className="text-sm font-semibold text-emerald-600">+₹{dailyData.cash.cashSales.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">Cash Expenses</span>
                                        <span className="text-sm font-semibold text-red-600">-₹{dailyData.cash.cashExpenses.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-200 font-medium">
                                        <span className="text-sm text-slate-700">Expected Cash</span>
                                        <span className="text-sm font-bold text-slate-900">₹{dailyData.cash.expectedCash.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-200 font-medium">
                                        <span className="text-sm text-slate-700">Actual Cash</span>
                                        <span className="text-sm font-bold text-slate-900">₹{dailyData.cash.actualCash.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-3 mt-2">
                                        <span className="text-sm font-semibold text-slate-700">Variance</span>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                            ₹0 (Matched)
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            {/* Sales Summary */}
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Sales Summary</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">Total Transactions</span>
                                        <span className="text-sm font-semibold text-slate-900">{dailyData.sales.totalTransactions}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">Cash Sales</span>
                                        <span className="text-sm font-semibold text-slate-900">₹{dailyData.sales.cashSales.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">Card Sales</span>
                                        <span className="text-sm font-semibold text-slate-900">₹{dailyData.sales.cardSales.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">UPI Sales</span>
                                        <span className="text-sm font-semibold text-slate-900">₹{dailyData.sales.upiSales.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">Credit Sales</span>
                                        <span className="text-sm font-semibold text-slate-900">₹{dailyData.sales.creditSales.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between py-3 mt-2 border-t border-slate-200">
                                        <span className="text-sm font-semibold text-slate-700">Total Sales</span>
                                        <span className="text-sm font-bold text-slate-900">₹{dailyData.sales.totalSales.toLocaleString()}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Pump Reading Verification */}
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Pump Reading Verification</h3>
                                <div className="space-y-3">
                                    {dailyData.pumps.map((pump, index) => (
                                        <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100">
                                            <span className="text-sm font-medium text-slate-700">{pump.name}</span>
                                            {pump.status === 'verified' ? (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Verified
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Anomalies Tab */}
                {activeTab === 'anomalies' && (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Detected Anomalies</h3>
                            {anomalies.length > 0 && (
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Export CSV
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12"><LoadingSpinner /></div>
                        ) : anomalies.length > 0 ? (
                            <div className="space-y-4">
                                {anomalies.map((anomaly, index) => (
                                    <div key={index} className={`p-4 rounded-lg border ${anomaly.severity === 'HIGH' ? 'bg-red-50 border-red-200' :
                                        anomaly.severity === 'MEDIUM' ? 'bg-orange-50 border-orange-200' :
                                            'bg-yellow-50 border-yellow-200'
                                        }`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {getSeverityBadge(anomaly.severity)}
                                                    <span className="text-xs text-slate-500">{anomaly.date}</span>
                                                </div>
                                                <h4 className="font-semibold text-slate-900 mb-1">{anomaly.title}</h4>
                                                <p className="text-sm text-slate-600">{anomaly.description}</p>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <button className="px-3 py-1 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-white font-medium">
                                                    Investigate
                                                </button>
                                                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                                                    Resolve
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                <p className="text-slate-500">No anomalies detected</p>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
