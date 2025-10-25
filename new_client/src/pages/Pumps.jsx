import React,{useState,useEffect} from "react"
import LoadingSpinner from "../components/LoadingSpinner"

export default function Pumps(){

    return <LoadingSpinner/>
    
    return(
        <div className="flex-1 bg-gradient-to-br from-orange-25 via-orange-50 to-orange-70 min-h-screen">
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-10"> 
                <div className="px-8 py-4"> 
                    <div className="flex items-center justify-between"> 
                        <div className="flex items-center gap-4"> 
                            <div> 
                                <h1 className="text-slate-900 flex items-center gap-2"> 
                                    Pump Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div> 
                                </h1> 
                                <p className="text-sm text-slate-600">Real-time fuel station monitoring</p> 
                            </div> 
                        </div>
                    </div> 
                </div> 
            </div>
        </div>
    )
}