import React, { useState, useEffect } from 'react'
import { dashboardService } from '../services/dashboardService'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend,
    PieChart, Pie, Cell
} from 'recharts'
import { Car, DollarSign, ArrowUpRight, User, Fuel, Droplets, Zap } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'





export default function Dashboard() {
    const [dataForCard, setDataForCard] = useState(null)
    const [cardLoading, setCardLoading] = useState(true)

    const [hourlyData, setHourlyData] = useState(null)
    const [hourlyLoading, setHourlyLoading] = useState(true)

    const [fuelDistribution, setFuelDistribution] = useState(true)
    const [fuelLoading, setFuelLoading] = useState(true)

    const [tanksLevel, setTanksLevel] = useState(null)
    const [tankLoading, setTankLoading] = useState(true)


    useEffect(() => {
        dashboardService.getDashboardSummary().then(res => {
            setDataForCard(res.data.data)
            setCardLoading(false)
        }).catch(error => console.log(error))

        dashboardService.getShiftSalesTrend().then(res => {
            setHourlyData(res.data.data)
            setHourlyLoading(false)
        }).catch(error => console.log(error))

        dashboardService.getFuelDistribution().then(res => {
            setFuelDistribution(res.data.data)
            setFuelLoading(false)
        })

        dashboardService.getTankLevels().then(res => {
            setTanksLevel(res.data.data)
            setTankLoading(false)
        }).catch(error => console.log(error))
    }, [])


    if (cardLoading || !dataForCard || hourlyLoading || !hourlyData || fuelLoading || !fuelDistribution || tankLoading || !tanksLevel) return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner/></div>
    console.log(dataForCard, hourlyData, fuelDistribution, tanksLevel)
    return (
        <div className="flex-1 bg-gradient-to-br from-orange-25 via-orange-50 to-orange-70 min-h-screen">
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-slate-900 flex items-center gap-2">
                                    Dashboard
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600">Real-time fuel station monitoring</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 my-8 px-8 '>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group'>
                    <div className="flex items-start justify-between mb-4 py-4">
                        <div className={`bg-orange-50 p-3 rounded-xl`}>
                            <DollarSign className={`size-6 text-orange-500`} />
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Last Shift's Revenue</p>
                    <h1 className="text-2xl font-semibold text-slate-900">₹{dataForCard.lastShift?.revenue?.toLocaleString()}</h1>
                    <p className="text-sm text-green-600">{dataForCard.lastShift?.revenueChange || '0%'} vs previous</p>
                </Card>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group'>
                    <div className="flex items-start justify-between mb-4 py-4">
                        <div className={`bg-green-50 p-3 rounded-xl`}>
                            <Car className={`size-6 text-green-500`} />
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Vehicle Served</p>
                    <h1 className="text-2xl font-semibold text-slate-900">{dataForCard.lastShift?.vehicles?.toLocaleString() || 0}</h1>
                    <p className="text-sm text-green-600">{dataForCard.lastShift?.vehicleChange || '0%'} vs previous</p>
                </Card>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group'>
                    <div className="flex items-start justify-between mb-4 py-4">
                        <div className={`bg-red-50 p-3 rounded-xl`}>
                            <Fuel className={`size-6 text-red-500`} />
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Fuel Dispensed</p>
                    <h1 className="text-2xl font-semibold text-slate-900">{dataForCard.lastShift?.fuelQuantity?.toLocaleString() || 0}</h1>
                    <p className="text-sm text-green-600">{dataForCard.lastShift?.staffUtilization || '0%'} vs previous</p>
                </Card>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group'>
                    <div className="flex items-start justify-between mb-4 py-4">
                        <div className={`bg-orange-50 p-3 rounded-xl`}>
                            <User className={`size-6 text-blue-500`} />
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">Active Staff</p>
                    <h1 className="text-2xl font-semibold text-slate-900">{dataForCard.lastShift?.activeStaff?.toLocaleString() || 0}</h1>
                    <p className="text-sm text-green-600">{dataForCard.lastShift?.staffUtilization || '0%'} utilization</p>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6 px-8">
                <Card className="p-4 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="flex items-center gap-2 mb-4 text-slate-900">
                        <Zap className='text-orange-500 size-6' /> Shift Sales Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={hourlyData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="sales" stroke="#8b5cf6" fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                <Card className="p-4 shadow-lg hover:shadow-xl transition-shadow">
                    <h3 className="flex items-center gap-2 mb-4 text-sm text-slate-600"><Droplets /> Fuel Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                        <Pie data={fuelDistribution} dataKey="percentage" nameKey="name" outerRadius={80} fill="#8884d8">
                            {fuelDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    )
}