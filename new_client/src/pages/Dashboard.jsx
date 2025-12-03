import React, { useState, useEffect } from "react"
import { dashboardService } from "../services/dashboardService"
import { creditService } from "../services/creditService"
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Legend,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Car,
    DollarSign,
    ArrowUpRight,
    User,
    Users,
    Fuel,
    Droplets,
    Zap,
    Clock,
    TrendingDown,
    TrendingUp,
    AlarmClock,
    AlertCircle,
    Play,
    ShoppingCart,
    Plus,
    RefreshCw,
    CreditCard
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const [dataForCard, setDataForCard] = useState(null);
    const [cardLoading, setCardLoading] = useState(true);

    const [hourlyData, setHourlyData] = useState([]);
    const [hourlyLoading, setHourlyLoading] = useState(true);

    const [fuelDistribution, setFuelDistribution] = useState([]);
    const [fuelLoading, setFuelLoading] = useState(true);

    const [tanksLevel, setTanksLevel] = useState([]);
    const [tankLoading, setTankLoading] = useState(true);

    const [weeklyPerformance, setWeeklyPerformance] = useState([]);
    const [weeklyLoading, setWeeklyLoading] = useState(true);

    const [recentActivity, setRecentActivity] = useState([]);
    const [recentLoading, setRecentLoading] = useState(true);

    const [todaySales, setTodaySales] = useState(0)
    const [totalOverDueCredits, setTotalOverDueCredits] = useState(0);
    const [todayTotalQuantity, setTodayTotalQuantity] = useState(0);
    const [totalFuelStock, setTotalFuelStock] = useState(0);

    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fuelColors = {
        Petrol: "#3b82f6", // Blue
        Diesel: "#10b981", // Emerald
        CNG: "#f59e0b",    // Amber
        Other: "#6b7280",
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    // Sample data for testing charts
    const sampleHourlyData = [
        { date: "Mon", sales: 1200 },
        { date: "Tue", sales: 1500 },
        { date: "Wed", sales: 900 },
        { date: "Thu", sales: 2000 },
        { date: "Fri", sales: 1800 },
        { date: "Sat", sales: 2200 },
        { date: "Sun", sales: 1600 },
    ];

    const sampleFuelDistribution = [
        { name: "Petrol", percentage: 45, color: "#3b82f6" },
        { name: "Diesel", percentage: 40, color: "#10b981" },
        { name: "Premium", percentage: 15, color: "#f59e0b" },
    ];

    const fetchDashboardData = async () => {
        try {
            // Fetch dashboard summary
            const summaryRes = await dashboardService.getDashboardSummary();
            const responseData = summaryRes.data.data;


            setDataForCard(responseData);
            setCardLoading(false);

            // Use the revenue and quantity from the API response (already calculated for today's all shifts)
            setTodaySales(responseData.lastShift?.revenue || 0);
            setTodayTotalQuantity(responseData.lastShift?.fuelQuantity || 0);

            // Fetch shift sales trend
            dashboardService
                .getShiftSalesTrend()
                .then((res) => {
                    setHourlyData(res.data.data.length ? res.data.data : sampleHourlyData);
                    setHourlyLoading(false);
                })
                .catch((error) => {
                    console.log(error);
                    setHourlyData(sampleHourlyData);
                    setHourlyLoading(false);
                });

            // Fetch fuel distribution
            dashboardService
                .getFuelDistribution()
                .then((res) => {
                    setFuelDistribution(
                        res.data.data.length ? res.data.data : sampleFuelDistribution
                    );
                    setFuelLoading(false);
                })
                .catch((error) => {
                    console.log(error);
                    setFuelDistribution(sampleFuelDistribution);
                    setFuelLoading(false);
                });

            // Fetch tank levels
            const tanksRes = await dashboardService.getTankLevels();
            const tanks = tanksRes.data.data.map((t) => ({
                ...t,
                statusColor:
                    t.status === "good"
                        ? "bg-emerald-500"
                        : t.status === "low"
                            ? "bg-yellow-500"
                            : "bg-red-500",
            }));
            setTanksLevel(tanks);
            setTotalFuelStock(tanks.reduce((acc, curr) => acc + curr.current, 0));
            setTankLoading(false);

            // Fetch monthly revenue
            dashboardService
                .getMonthlyRevenue()
                .then((res) => {
                    setWeeklyPerformance(res.data.data); // Reusing state variable for simplicity
                    setWeeklyLoading(false);
                })
                .catch((error) => console.log(error));

            // Fetch recent activity
            dashboardService
                .getRecentActivity(5)
                .then((res) => {
                    setRecentActivity(res.data.data);
                    setRecentLoading(false);
                })
                .catch((error) => console.log(error));

            // Fetch overdue credits
            const creditsRes = await creditService.getOverdueCredits();
            setTotalOverDueCredits(creditsRes.data.data.length);

            setLastRefreshed(new Date());
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        fetchDashboardData();
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (
        cardLoading ||
        !dataForCard ||
        hourlyLoading ||
        fuelLoading ||
        tankLoading ||
        weeklyLoading
    )
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <LoadingSpinner />
            </div>
        );

    return (
        <div className="flex-1 bg-gradient-to-br from-orange-50 via-orange-50 to-orange-100 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 w-full justify-between">
                            <div>
                                <h1 className="text-slate-900 flex items-center gap-2">
                                    Dashboard
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600">
                                    Real-time fuel station monitoring
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleManualRefresh}
                                    disabled={isRefreshing}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-orange-50 border border-slate-200 rounded-lg transition-colors text-sm font-medium text-slate-700 disabled:opacity-50"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                                <span className="text-xs text-slate-500">
                                    Updated: {lastRefreshed.toLocaleTimeString()}
                                </span>
                                <span className="text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* Top Stats Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Today's Sales */}
                    <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Today's Sales</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{todaySales.toLocaleString()}</h3>
                            </div>
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            <span>Today's Revenue</span>
                        </div>
                    </Card>

                    {/* Active Shift */}
                    <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Active Staff</p>
                                <h3 className="text-xl font-bold text-slate-900 mt-1">{dataForCard.lastShift?.activeStaff?.toLocaleString() || 0}</h3>
                                <p className="text-xs text-slate-400 mt-1">On Duty</p>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${dataForCard.lastShift?.staffUtilization || 0}%` }}></div>
                        </div>
                    </Card>

                    {/* Total Fuel Stock */}
                    <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Fuel Stock</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalFuelStock.toLocaleString()} L</h3>
                            </div>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Fuel className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 w-fit px-2 py-1 rounded-full">
                            <Droplets className="w-3 h-3" />
                            <span>Across all tanks</span>
                        </div>
                    </Card>

                    {/* Overdue Payments */}
                    <Card className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Overdue Accounts</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalOverDueCredits}</h3>
                            </div>
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 w-fit px-2 py-1 rounded-full">
                            <span>Action Required</span>
                        </div>
                    </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Weekly Sales Trend */}
                    <Card className="lg:col-span-2 p-6 border-0 shadow-sm bg-white">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Weekly Sales Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={hourlyData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1e293b' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                Sales (₹)
                            </div>
                            {/* Removed hardcoded Target (₹) legend */}
                        </div>
                    </Card>

                    {/* Fuel Distribution */}
                    <Card className="p-6 border-0 shadow-sm bg-white">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Fuel Distribution</h3>
                        <div className="h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={fuelDistribution}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="percentage"
                                    >
                                        {fuelDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={fuelColors[entry.name] || '#6b7280'} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-slate-900">
                                    {fuelDistribution[0]?.percentage || 0}%
                                </span>
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                    {fuelDistribution[0]?.name || 'Fuel'}
                                </span>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            {fuelDistribution.map((item, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fuelColors[item.name] || '#6b7280' }}></div>
                                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">{item.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Charts Row 2 & Quick Actions */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Monthly Revenue */}
                    <Card className="lg:col-span-2 p-6 border-0 shadow-sm bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Monthly Revenue</h3>
                            <select className="text-sm border-slate-200 rounded-lg text-slate-600 focus:ring-orange-500">
                                <option>Last 6 Months</option>
                                <option>This Year</option>
                            </select>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={weeklyPerformance} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#fff7ed' }}
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Quick Actions */}
                    <Card className="p-6 border-0 shadow-sm bg-white">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
                        <div className="flex flex-col gap-3">
                            <Link to="/shifts">
                                <button className="w-full flex items-center gap-3 p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors font-medium shadow-sm">
                                    <Play className="w-5 h-5" />
                                    Start New Shift
                                </button>
                            </Link>
                            <Link to="/sales">
                                <button className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 hover:bg-orange-50 text-slate-700 rounded-xl transition-colors font-medium">
                                    <ShoppingCart className="w-5 h-5 text-slate-500" />
                                    Record Sale
                                </button>
                            </Link>
                            <Link to="/expenses">
                                <button className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 hover:bg-orange-50 text-slate-700 rounded-xl transition-colors font-medium">
                                    <Plus className="w-5 h-5 text-slate-500" />
                                    Add Expense
                                </button>
                            </Link>
                            <Link to="/tanks">
                                <button className="w-full flex items-center gap-3 p-3 bg-white border border-slate-200 hover:bg-orange-50 text-slate-700 rounded-xl transition-colors font-medium">
                                    <RefreshCw className="w-5 h-5 text-slate-500" />
                                    Update Tank Reading
                                </button>
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Bottom Row: Alerts & Recent Transactions */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Alerts & Notifications */}
                    <Card className="p-6 border-0 shadow-sm bg-white">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Alerts & Notifications</h3>
                        <div className="space-y-4">
                            {/* Logic to show alerts based on tank levels or overdue payments could be added here. For now, keeping static examples but they should ideally be dynamic. */}
                            {tanksLevel.filter(t => t.status === 'low').map(tank => (
                                <div key={tank._id} className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex gap-4">
                                    <div className="mt-1">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">Low Fuel Stock - {tank.name}</h4>
                                        <p className="text-sm text-slate-600 mt-1">{tank.fuelType} level at {tank.percentage}%. Immediate restock required.</p>
                                    </div>
                                </div>
                            ))}
                            {totalOverDueCredits > 0 && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-4">
                                    <div className="mt-1">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900">Payment Overdue</h4>
                                        <p className="text-sm text-slate-600 mt-1">{totalOverDueCredits} customers have overdue payments.</p>
                                    </div>
                                </div>
                            )}
                            {tanksLevel.filter(t => t.status === 'low').length === 0 && totalOverDueCredits === 0 && (
                                <div className="text-center py-4 text-slate-500 text-sm">No active alerts</div>
                            )}
                        </div>
                    </Card>

                    {/* Recent Transactions */}
                    <Card className="p-6 border-0 shadow-sm bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
                            <Link to="/transactions" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                                View All
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? recentActivity.map((act, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            {act.type === 'Sale' ? (
                                                <CreditCard className="w-5 h-5 text-slate-600" />
                                            ) : (
                                                <Fuel className="w-5 h-5 text-slate-600" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900">{act.vehicle || act.supplier || "Unknown"}</h4>
                                            <p className="text-xs text-slate-500">{act.type} • {act.time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">₹{act.amount.toLocaleString()}</p>
                                        <Badge variant="outline" className="text-xs mt-1">{act.paymentMethod || 'Cash'}</Badge>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-slate-500">No recent transactions</div>
                            )}
                        </div>
                        {/* <div className="mt-6 text-center">
                            <button className="text-sm text-orange-600 font-medium hover:underline">View All Transactions</button>
                        </div> */}
                    </Card>
                </div>
            </div>
        </div>
    );
}
