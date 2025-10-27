import React, { useState, useEffect } from 'react'
import { dashboardService } from '../services/dashboardService'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart,
    Legend, Bar,
    PieChart, Pie, Cell
} from 'recharts'
import { Car, DollarSign, ArrowUpRight, User, Fuel, Droplets, Zap, BarChart3,Clock, TrendingDown,TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Dashboard() {
    const [dataForCard, setDataForCard] = useState(null)
    const [cardLoading, setCardLoading] = useState(true)

    const [hourlyData, setHourlyData] = useState([])
    const [hourlyLoading, setHourlyLoading] = useState(true)

    const [fuelDistribution, setFuelDistribution] = useState([])
    const [fuelLoading, setFuelLoading] = useState(true)

    const [tanksLevel, setTanksLevel] = useState([])
    const [tankLoading, setTankLoading] = useState(true)

    const [weeklyPerformance, setWeeklyPerformance] = useState([])
    const [weeklyLoading, setWeeklyLoading] = useState(true)

    const [recentActivity, setRecentActivity] = useState([])
    const [recentLoading, setRecentLoading] = useState(true)

    const fuelColors = {
        Petrol: "#f97316",
        Diesel: "#10b981",
        CNG: "#f59e0b",
        Other: "#6b7280"
    }

    // Sample data for testing charts
    const sampleHourlyData = [
        { date: "20/10/2025", sales: 1200 },
        { date: "21/10/2025", sales: 1500 },
        { date: "22/10/2025", sales: 900 },
        { date: "23/10/2025", sales: 2000 },
        { date: "24/10/2025", sales: 1800 },
    ]

    const sampleFuelDistribution = [
        { name: "Petrol", percentage: 50, color: "#8b5cf6" },
        { name: "Diesel", percentage: 30, color: "#10b981" },
        { name: "CNG", percentage: 20, color: "#f59e0b" },
    ]

    const sampleWeeklyPerformance = [
        { week: "Mon", revenue: 52000, target: 80000, quantity: 1200 },
        { week: "Tue", revenue: 61000, target: 80000, quantity: 1350 },
        { week: "Wed", revenue: 48000, target: 80000, quantity: 1100 },
        { week: "Thu", revenue: 75000, target: 80000, quantity: 1500 },
        { week: "Fri", revenue: 69000, target: 80000, quantity: 1400 },
        { week: "Sat", revenue: 82000, target: 80000, quantity: 1600 },
        { week: "Sun", revenue: 60000, target: 80000, quantity: 1300 },
    ];

    const sampleTankLevels = [
        {
            "name": "PetrolTank1",
            "tankNumber": 1,
            "fuelType": "Petrol",
            "current": 3500,
            "capacity": 5000,
            "percentage": 70,
            "status": "good",
            "lastUpdated": "2025-10-24T08:00:00.000Z"
        },
        {
            "name": "DieselTank2",
            "tankNumber": 2,
            "fuelType": "Diesel",
            "current": 1200,
            "capacity": 5000,
            "percentage": 24,
            "status": "low",
            "lastUpdated": "2025-10-24T08:15:00.000Z"
        }
    ]
    useEffect(() => {
        dashboardService.getDashboardSummary()
            .then(res => {
                setDataForCard(res.data.data)
                setCardLoading(false)
            })
            .catch(error => console.log(error))

        dashboardService.getShiftSalesTrend()
            .then(res => {
                setHourlyData(res.data.data.length ? res.data.data : sampleHourlyData)
                setHourlyLoading(false)
            })
            .catch(error => {
                console.log(error)
                setHourlyData(sampleHourlyData)
                setHourlyLoading(false)
            })

        dashboardService.getFuelDistribution()
            .then(res => {
                setFuelDistribution(res.data.data.length ? res.data.data : sampleFuelDistribution)
                setFuelLoading(false)
            })
            .catch(error => {
                console.log(error)
                setFuelDistribution(sampleFuelDistribution)
                setFuelLoading(false)
            })

        dashboardService.getTankLevels()
            .then(res => {
                const tanks = res.data.data.map(t => ({
                    ...t,
                    statusColor:
                        t.status === 'good' ? 'bg-emerald-500' :
                            t.status === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                }));
                setTanksLevel(tanks);
                setTankLoading(false)
            })
            .catch(error => console.log(error))

        dashboardService.getWeeklyPerformance().then(res => {
            setWeeklyPerformance(res.data.data)
            setWeeklyLoading(false)
        }).catch(error => console.log(error))

        dashboardService.getRecentActivity(10).then(res => {
            setRecentActivity(res.data.data)
            setRecentLoading(false)
        }).catch(error => console.log(error))
    }, [])

    if (
        cardLoading || !dataForCard ||
        hourlyLoading || !hourlyData.length ||
        fuelLoading || !fuelDistribution.length ||
        tankLoading || !tanksLevel ||
        weeklyLoading || !weeklyPerformance
    ) return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>

    return (
        <div className="flex-1 bg-gradient-to-br from-orange-25 via-orange-50 to-orange-70 min-h-screen">
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10"> <div className="px-8 py-4"> <div className="flex items-center justify-between"> <div className="flex items-center gap-4"> <div> <h1 className="text-slate-900 flex items-center gap-2"> Dashboard <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div> </h1> <p className="text-sm text-slate-600">Real-time fuel station monitoring</p> </div> </div> </div> </div> </div>
            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 my-8 px-8'>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group'>
                    <div className="flex items-start justify-between mb-4 py-1">
                        <div className="bg-orange-50 p-3 rounded-xl flex gap-2">
                            <DollarSign className="size-6 text-orange-500" />
                            <p className="text-md font-semibold text-slate-800 mb-1">Last Shift's Revenue</p>
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 px-4">₹{dataForCard.lastShift?.revenue?.toLocaleString()}</h1>
                    <p className={`text-sm flex gap-1 items-center ${dataForCard.lastShift.revenueChange[0] == '+' ? "text-green-600" : "text-red-600" } px-4`}> {dataForCard.lastShift.revenueChange[0] == '+' ? <TrendingUp className='size-5 text-green-400' /> : <TrendingDown className='size-5 text-red-400' /> }  {dataForCard.lastShift?.revenueChange || '0%'} <span className='text-slate-600'>from previous </span></p>
                </Card>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group '>
                    <div className="flex items-start justify-between mb-4 py-1">
                        <div className="bg-green-50 p-3 rounded-xl flex gap-2">
                            <Car className="size-6 text-green-500" />
                            <p className="text-md font-semibold text-slate-800 mb-1">Vehicle Served</p>
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 px-4">{dataForCard.lastShift?.vehicles?.toLocaleString() || 0}</h1>
                    <p className={`text-sm flex gap-1 ${dataForCard.lastShift.vehicleChange[0] == '+' ? "text-green-600" : "text-red-600" } px-4`}> {dataForCard.lastShift.vehicleChange[0] == '+' ? <TrendingUp className='size-5 text-green-400' /> : <TrendingDown className='size-5 text-red-400' /> } {dataForCard.lastShift?.vehicleChange || '0%'} <span className='text-slate-600'>from previous </span></p>
                </Card>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group '>
                    <div className="flex items-start justify-between mb-4 py-1">
                        <div className="bg-red-50 p-3 rounded-xl flex gap-2">
                            <Fuel className="size-6 text-red-500" />
                            <p className="text-md font-semibold text-slate-800 mb-1">Fuel Dispensed</p>
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 px-4">{dataForCard.lastShift?.fuelQuantity?.toLocaleString() || 0} L</h1>
                    <p className={`text-sm flex gap-1 ${dataForCard.lastShift.quantityChange[0] == '+' ? "text-green-600" : "text-red-600" } px-4`}> {dataForCard.lastShift.quantityChange[0] == '+' ? <TrendingUp className='size-5 text-green-400' /> : <TrendingDown className='size-5 text-red-400' /> } {dataForCard.lastShift?.quantityChange || '0%'} <span className='text-slate-600'>from previous </span></p>
                </Card>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group '>
                    <div className="flex items-start justify-between mb-4 py-1">
                        <div className="bg-blue-50 p-3 rounded-xl flex gap-2">
                            <User className="size-6 text-blue-500" />
                            <p className="text-md font-semibold text-slate-800 mb-1">Active Staff</p>
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 px-4">{dataForCard.lastShift?.activeStaff?.toLocaleString() || 0}</h1>
                    <p className="text-sm text-slate-600 px-4">{dataForCard.lastShift?.staffUtilization || '0%'} utilization</p>
                </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6 px-8">
                <Card className="col-span-2 px-8 py-4  shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="flex items-center gap-2 mb-4 text-slate-900">
                        <Zap className='text-orange-500 size-6' /> Shift Sales Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={hourlyData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.5} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#d1d5db" strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }}/>
                            <Tooltip />
                            <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={2} animationDuration={2000} animationEasing="ease-in-out" name="Sales (₹)" fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="col-span-1 p-4 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="flex items-center gap-2 mb-4 text-sm text-slate-600"><Droplets className='text-orange-500' /> Fuel Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={fuelDistribution}
                                dataKey="percentage"
                                nameKey="name"
                                outerRadius={80}
                                innerRadius={40}
                                paddingAngle={5}
                            >
                                {fuelDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={fuelColors[entry.name] || "#6b7280"} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3 mt-4">
                        {fuelDistribution.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full" style={{ backgroundColor: fuelColors[item.name] || "#6b7280" }}></div>
                                    <span className="text-sm text-slate-700">{item.name}</span>
                                </div>
                                <span className="text-sm font-medium text-slate-900">{item.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="my-8 px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="text-slate-900 font-semibold">
                        Weekly Revenue
                    </h3>
                    <p className="text-sm text-slate-600">Revenue vs Target</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={weeklyPerformance} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid stroke="#d1d5db" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="week" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                }}
                                formatter={(value) => `₹${value.toLocaleString()}`}
                            />
                            <Legend />
                            <Bar dataKey="revenue" fill="#f97316" radius={[8, 8, 0, 0]} name="Revenue" />
                            <Bar dataKey="target" fill="#10b981" radius={[8, 8, 0, 0]} name="Target" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur">
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-slate-900 font-semibold">Tank Levels</h3>
                            <p className="text-sm text-slate-600">Real-time inventory status</p>
                        </div>

                        <div className="space-y-5">
                            {tanksLevel.map((tank) => (
                                <div key={tank._id} >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-slate-700 font-medium">
                                            {tank.name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {tank.percentage}%
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`text-xs capitalize ${tank.status === 'good'
                                                    ? 'bg-emerald-200 text-emerald-700 border-emerald-200'
                                                    : tank.status === 'low'
                                                        ? 'bg-yellow-200 text-yellow-700 border-yellow-200'
                                                        : 'bg-red-200 text-red-700 border-red-200'
                                                    }`}
                                            >
                                                {tank.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${tank.status === 'good'
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                                : tank.status === 'low'
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                    : 'bg-gradient-to-r from-red-500 to-rose-500'
                                                }`}
                                            style={{ width: `${tank.percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5">
                                        {tank.current.toLocaleString()}L /{' '}
                                        {tank.capacity.toLocaleString()}L
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <div className="my-8 px-8">
                <Card className="border-0 shadow-lg shadow-slate-200/50 bg-white/80 backdrop-blur">
                    <div className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <Clock className="text-orange-500 w-4 h-4" />
                            <h3 className="text-slate-900 font-semibold">Recent Activity</h3>
                        </div>
                        <div className="space-y-3">
                            {recentActivity.map((act) => (
                                <div
                                    key={act.id}
                                    className="p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 text-orange-600 font-semibold rounded-full flex items-center justify-center">
                                            {act.vehicle?.slice(0, 2).toUpperCase() || 'RV'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {act.vehicle || act.supplier}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {act.fuel} • {act.liters}L • {act.time}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-slate-900">
                                            ₹{act.amount.toLocaleString()}
                                        </p>
                                        <Badge
                                            className={`mt-1 text-xs capitalize ${act.type === 'Sale'
                                                    ? 'bg-emerald-200 text-emerald-700 border-emerald-200'
                                                    : act.type === 'Refill'
                                                        ? 'bg-blue-200 text-blue-700 border-blue-200'
                                                        : 'bg-slate-200 text-slate-700 border-slate-200'
                                                }`}
                                            variant="outline"
                                        >
                                            {act.type}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>


    )
}
