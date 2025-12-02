import React, { useState, useEffect } from "react";
import { reportService } from "../services/reportService";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import {
    TrendingUp,
    TrendingDown,
    Users,
    CreditCard,
    DollarSign,
    Activity
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    Cell
} from "recharts";

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await reportService.getAnalyticsDashboard();
            setData(response.data.data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>;
    if (!data) return <div className="p-8 text-center">No data available</div>;

    return (
        <div className="flex-1 bg-slate-50 min-h-screen pb-10">
            <div className="px-8 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                    <p className="text-sm text-slate-600">Business insights and performance metrics</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${data.cards.avgDailySales.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {data.cards.avgDailySales.change >= 0 ? '+' : ''}{data.cards.avgDailySales.change}%
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Avg Daily Sales</p>
                        <h3 className="text-2xl font-bold text-slate-900">₹{data.cards.avgDailySales.value.toLocaleString()}</h3>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${data.cards.profitMargin.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {data.cards.profitMargin.change >= 0 ? '+' : ''}{data.cards.profitMargin.change}%
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Profit Margin</p>
                        <h3 className="text-2xl font-bold text-slate-900">{data.cards.profitMargin.value}%</h3>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-purple-50 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${data.cards.activeCustomers.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {data.cards.activeCustomers.change >= 0 ? '+' : ''}{data.cards.activeCustomers.change}%
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Active Customers</p>
                        <h3 className="text-2xl font-bold text-slate-900">{data.cards.activeCustomers.value}</h3>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <CreditCard className="w-5 h-5 text-orange-600" />
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${data.cards.avgTransaction.change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {data.cards.avgTransaction.change >= 0 ? '+' : ''}{data.cards.avgTransaction.change}%
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">Avg Transaction</p>
                        <h3 className="text-2xl font-bold text-slate-900">₹{data.cards.avgTransaction.value.toLocaleString()}</h3>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue & Profit Trend */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Revenue & Profit Trend</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.revenueTrend}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                    />
                                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Sales (₹)" />
                                    <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name="Profit (₹)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm text-slate-600">Sales (₹)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-sm text-slate-600">Profit (₹)</span>
                            </div>
                        </div>
                    </Card>

                    {/* Fuel Type Performance */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Fuel Type Performance</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.fuelPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Sales (₹)">
                                        {data.fuelPerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#3b82f6" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center mt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-blue-500"></div>
                                <span className="text-sm text-slate-600">Sales (₹)</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Customers */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Top Customers</h3>
                        <div className="space-y-4">
                            {data.topCustomers.map((customer, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{customer.name}</p>
                                            <p className="text-xs text-slate-500">{customer.visits} visits</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900">₹{customer.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Month-over-Month Comparison */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Month-over-Month Comparison</h3>
                        <div className="space-y-6">
                            {/* Sales Growth */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">Sales Growth</span>
                                    <span className="text-sm font-bold text-emerald-600">+{data.comparisons.salesGrowth}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                                </div>
                            </div>

                            {/* Customer Acquisition */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">Customer Acquisition</span>
                                    <span className="text-sm font-bold text-blue-600">+{data.comparisons.customerAcquisition}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>

                            {/* Avg Transaction Value */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">Average Transaction Value</span>
                                    <span className="text-sm font-bold text-red-600">{data.comparisons.avgTransactionValue}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>

                            {/* Profit Margin */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">Profit Margin</span>
                                    <span className="text-sm font-bold text-emerald-600">+{data.comparisons.profitMarginChange}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
