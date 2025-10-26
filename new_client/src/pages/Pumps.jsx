import React, { useState, useEffect } from "react"
import { pumpService } from "../services/pumpService"
import LoadingSpinner from "../components/LoadingSpinner"
import { Plus, Fuel, ArrowUpRight, Droplet, TrendingUp } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"

export default function Pumps() {
    const [allPumps, setAllPumps] = useState([])
    const [allPumpsLoading, setAllPumpsLoading] = useState(true)

    const [nozzles, setNozzles] = useState([])
    let [notassigned, setNotAssigned] = useState(0)

    const [activePumps, setActivePumps] = useState(null)
    const [activeLoading, setActiveLoading] = useState(true)

    const [maintainancePumps, setMaintainancePumps] = useState(null)
    const [maintainanceLoading, setMaintainanceLoading] = useState(true)

    const [withSales,setWithSales] = useState([])
    const [withSalesLoading,setWithSalesLoading] = useState(true)

    let [totSales,setTotSales] = useState(0)
    let [totQuantity,setTotQuantity] = useState(0)

    useEffect(() => {
        pumpService.getAll().then(res => {
            setAllPumps(res.data.data)
        }).catch(error => console.log(error))
            .finally(setAllPumpsLoading(false))

        pumpService.getByStatus('active').then(res => {
            setActivePumps(res.data.data)
        }).catch(error => console.log(error)).finally(setActiveLoading(false))

        pumpService.getByStatus('under-maintainance').then(res => {
            setMaintainancePumps(res.data.data)
        }).catch(error => console.log(error)).finally(setMaintainanceLoading(false))

        pumpService.getPumpsWithSales().then(res=>{
            setWithSales(res.data.data)
        }).catch(error=> console.log(error))
        .finally(setWithSalesLoading(false))

    }, [])

    useEffect(() => {
        if (Array.isArray(allPumps) && allPumps.length > 0) {
            const combined = allPumps.flatMap(pump => pump.nozzles || []);
            setNozzles(combined);
            let count = 0;
            for (const pump of allPumps) {
                for (const nozzle of pump.nozzles || []) {
                    if (!nozzle.assignedEmployee) {
                        count++;
                    }
                }
            }
            setNotAssigned(count)
        }
    }, [allPumps]);

    useEffect(()=>{
        if(Array.isArray(withSales) && withSales.length > 0){
            let summAmount = 0;
            let summQuantity = 0;
            for(const sale of withSales){
                summAmount += sale.todaySalesAmount
                summQuantity += sale.todaySalesQuantity
            }
            setTotSales(summAmount)
            setTotQuantity(summQuantity)
        }
    },[withSales])

    if (allPumpsLoading || !allPumps ||
        activeLoading || !activePumps ||
        maintainanceLoading || !maintainancePumps ||
        withSalesLoading || !withSales
    ) return <LoadingSpinner />


    return (
        <div className="flex-1 bg-gradient-to-br from-orange-25 via-orange-50 to-orange-70 min-h-screen">
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center justify-between w-[100%]">
                            <div>
                                <h1 className="text-slate-900 flex items-center gap-2">
                                    Pump Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600">Real-time fuel station monitoring</p>
                            </div>
                            <div>
                                <Button className="bg-orange-500 cursor-pointer flex gap-1 items-center text-white hover:text-black transition-colors duration-500" variant="outline">
                                    <Plus className="size-4" />
                                    <p>Add New DU</p>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 my-8 px-8">
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group'>
                    <div className="flex items-start justify-between mb-4 py-1">
                        <div className="bg-orange-50 p-3 rounded-xl flex gap-2">
                            <Fuel className="size-6 text-orange-500" />
                            <p className="text-md font-semibold text-slate-800 mb-1">Total Pumps</p>
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-600 px-4"> {allPumps.length} Stations </h1>
                    <p className="text-sm text-green-600 px-4">{activePumps.length} active • {maintainancePumps.length} maintenance</p>
                </Card>
                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group'>
                    <div className="flex items-start justify-between mb-4 py-1">
                        <div className="bg-green-50 p-3 rounded-xl flex gap-2">
                            <Droplet className="size-6 text-green-500" />
                            <p className="text-md font-semibold text-slate-800 mb-1">Total Nozzles</p>
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-600 px-4"> {nozzles.length} units </h1>
                    <p className="text-sm text-green-600 px-4">{nozzles.length - notassigned} assigned • {notassigned} unassigned</p>
                </Card>

                <Card className='p-4 relative shadow-s hover:shadow-lg transition-shadow group'>
                    <div className="flex items-start justify-between mb-4 py-1">
                        <div className="bg-green-50 p-3 rounded-xl flex gap-2">
                            <TrendingUp className="size-6 text-red-500" />
                            <p className="text-md font-semibold text-slate-800 mb-1">Today's Sales</p>
                        </div>
                        <ArrowUpRight className="size-5 text-slate-400 transition-colors group-hover:text-orange-500" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-600 px-4"> ₹{totSales} revenue </h1>
                    <p className="text-sm text-green-600 px-4">{totQuantity}L dispend today</p>
                </Card>
            </div>
        </div>
    )
}