import React, { useState, useEffect } from "react";
import { saleService } from "../services/saleService";
import { pumpService } from "../services/pumpService";
import { customerService } from "../services/customerService";
import { employeeService } from "../services/employeeService";
import { shiftService } from "../services/shiftService";
import { organizationService } from "../services/organizationService";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Play
} from "lucide-react";


export default function Sales() {
    const [activeTab, setActiveTab] = useState("record"); // "record" or "history"
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pumps, setPumps] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [activeShift, setActiveShift] = useState(null);
    const [fuelPrices, setFuelPrices] = useState({ petrol: 0, diesel: 0, premium: 0 });

    // Form state
    const [saleForm, setSaleForm] = useState({
        fuelType: "petrol",
        quantity: "",
        pricePerLiter: "",
        saleType: "cash",
        pumpId: "",
        nozzleId: "",
        customerId: "",
        employeeId: "",
        vehicleNumber: "",
        notes: ""
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [fuelFilter, setFuelFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const salesPerPage = 10;

    useEffect(() => {
        fetchSales();
        fetchPumps();
        fetchCustomers();
        fetchEmployees();
        fetchActiveShift();
        fetchFuelPrices();
    }, []);

    // Auto-populate price when fuel type changes
    useEffect(() => {
        if (saleForm.fuelType && fuelPrices[saleForm.fuelType]) {
            setSaleForm(prev => ({
                ...prev,
                pricePerLiter: fuelPrices[saleForm.fuelType]
            }));
        }
    }, [saleForm.fuelType, fuelPrices]);

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await saleService.getAll();
            setSales(res.data.data || []);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPumps = async () => {
        try {
            const res = await pumpService.getAll();
            setPumps(res.data.data || []);
        } catch (error) {
            console.error("Error fetching pumps:", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await customerService.getAll();
            setCustomers(res.data.data || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await employeeService.getAll();
            setEmployees(res.data.data || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const fetchFuelPrices = async () => {
        try {
            const res = await organizationService.getOrganization();
            if (res.data.data && res.data.data.fuelPricing) {
                setFuelPrices(res.data.data.fuelPricing);
            }
        } catch (error) {
            console.error("Error fetching fuel prices:", error);
        }
    };

    const fetchActiveShift = async () => {
        try {
            const res = await shiftService.getAll();
            const active = res.data.data?.find(s => s.status === 'active');
            setActiveShift(active || null);
        } catch (error) {
            console.error("Error fetching active shift:", error);
        }
    };

    const handleSubmitSale = async (e) => {
        e.preventDefault();

        if (!activeShift) {
            toast.error("No active shift found. Please start a shift first.");
            return;
        }

        try {
            const saleData = {
                ...saleForm,
                shiftId: activeShift._id,
                quantity: parseFloat(saleForm.quantity),
                pricePerLiter: parseFloat(saleForm.pricePerLiter),
                totalAmount: parseFloat(saleForm.quantity) * parseFloat(saleForm.pricePerLiter),
                customerId: saleForm.customerId || null
            };

            await saleService.create(saleData);

            // Reset form
            setSaleForm({
                fuelType: "petrol",
                quantity: "",
                pricePerLiter: 95,
                saleType: "cash",
                pumpId: "",
                nozzleId: "",
                customerId: "",
                employeeId: "",
                vehicleNumber: "",
                notes: ""
            });

            fetchSales();
            toast.success("Sale recorded successfully!");
        } catch (error) {
            console.error("Error creating sale:", error);
            toast.error(error.response?.data?.message || "Error recording sale");
        }
    };

    const handleClear = () => {
        setSaleForm({
            fuelType: "petrol",
            quantity: "",
            pricePerLiter: "",
            saleType: "cash",
            pumpId: "",
            nozzleId: "",
            customerId: "",
            employeeId: "",
            vehicleNumber: "",
            notes: ""
        });
    };

    const getPaymentBadgeClass = (type) => {
        const classes = {
            cash: "bg-emerald-100 text-emerald-700 border-0",
            credit: "bg-orange-100 text-orange-700 border-0",
            card: "bg-blue-100 text-blue-700 border-0",
            upi: "bg-purple-100 text-purple-700 border-0",
            fleet: "bg-slate-100 text-slate-700 border-0"
        };
        return classes[type] || classes.cash;
    };

    const filteredSales = sales.filter(sale => {
        const matchesSearch = sale.saleId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFuel = fuelFilter === "all" || sale.fuelType === fuelFilter;
        const matchesPayment = paymentFilter === "all" || sale.saleType === paymentFilter;
        const matchesDate = !dateFilter || new Date(sale.date).toISOString().slice(0, 10) === dateFilter;

        return matchesSearch && matchesFuel && matchesPayment && matchesDate;
    });

    // Pagination calculations
    const indexOfLastSale = currentPage * salesPerPage;
    const indexOfFirstSale = indexOfLastSale - salesPerPage;
    const currentSales = filteredSales.slice(indexOfFirstSale, indexOfLastSale);
    const totalPages = Math.ceil(filteredSales.length / salesPerPage);


    const totalAmount = saleForm.quantity && saleForm.pricePerLiter
        ? (parseFloat(saleForm.quantity) * parseFloat(saleForm.pricePerLiter)).toFixed(2)
        : "0.00";

    const selectedPump = pumps.find(p => p._id === saleForm.pumpId);
    const nozzles = selectedPump?.nozzles || [];

    if (loading && sales.length === 0) {
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-slate-900 flex items-center gap-2">
                                    Sales Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600">
                                    Record and manage fuel sales
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-8">
                <div className="flex gap-4 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("record")}
                        className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === "record"
                            ? "text-orange-600 border-b-2 border-orange-600"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Record Sale
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`px-4 py-3 font-medium text-sm transition-colors relative ${activeTab === "history"
                            ? "text-orange-600 border-b-2 border-orange-600"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Sales History
                    </button>
                </div>
            </div>

            <div className="p-8">
                {activeTab === "record" ? (
                    /* Record Sale Tab */
                    <Card className="p-8">
                        <h2 className="text-xl font-semibold text-slate-900 mb-6">New Sale Entry</h2>

                        {!activeShift && (
                            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm text-orange-800">
                                    ⚠️ No active shift found. Please start a shift before recording sales.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmitSale} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Fuel Type */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Fuel Type
                                    </label>
                                    <select
                                        required
                                        value={saleForm.fuelType}
                                        onChange={(e) => setSaleForm({ ...saleForm, fuelType: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                    >
                                        <option value="petrol">Petrol</option>
                                        <option value="diesel">Diesel</option>
                                        <option value="cng">CNG</option>
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Quantity (Liters)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        value={saleForm.quantity}
                                        onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                                        placeholder="Enter quantity"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                {/* Rate per Liter */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Rate per Liter
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        placeholder="Enter rate per liter"
                                        value={saleForm.pricePerLiter}
                                        onChange={(e) => setSaleForm({ ...saleForm, pricePerLiter: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                {/* Total Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Total Amount
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={`₹${totalAmount}`}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-semibold"
                                    />
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Payment Method
                                    </label>
                                    <select
                                        required
                                        value={saleForm.saleType}
                                        onChange={(e) => setSaleForm({ ...saleForm, saleType: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="upi">UPI</option>
                                        <option value="credit">Credit</option>
                                        <option value="fleet">Fleet</option>
                                    </select>
                                </div>

                                {/* Customer */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Customer
                                    </label>
                                    <select
                                        value={saleForm.customerId}
                                        onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}
                                        required={saleForm.saleType === 'credit' || saleForm.saleType === 'fleet'}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                    >
                                        <option value="">Walk-in Customer</option>
                                        {customers.map(customer => (
                                            <option key={customer._id} value={customer._id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Pump Number */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Pump Number
                                    </label>
                                    <select
                                        required
                                        value={saleForm.pumpId}
                                        onChange={(e) => setSaleForm({ ...saleForm, pumpId: e.target.value, nozzleId: "" })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                    >
                                        <option value="">Select Pump</option>
                                        {pumps.map(pump => (
                                            <option key={pump._id} value={pump._id}>
                                                {pump.pumpNumber}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Nozzle */}
                                {saleForm.pumpId && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Nozzle
                                        </label>
                                        <select
                                            required
                                            value={saleForm.nozzleId}
                                            onChange={(e) => {
                                                const newNozzleId = e.target.value;
                                                const selectedPump = pumps.find(p => p._id === saleForm.pumpId);
                                                const selectedNozzle = selectedPump?.nozzles.find(n => n._id === newNozzleId);

                                                setSaleForm(prev => ({
                                                    ...prev,
                                                    nozzleId: newNozzleId,
                                                    employeeId: selectedNozzle?.assignedEmployee?._id || prev.employeeId
                                                }));
                                            }}
                                            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                        >
                                            <option value="">Select Nozzle</option>
                                            {nozzles.map(nozzle => (
                                                <option key={nozzle._id} value={nozzle._id}>
                                                    {nozzle.nozzleId} - {nozzle.fueltype || nozzle.fuelType}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Employee */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Employee
                                    </label>
                                    <select
                                        value={saleForm.employeeId}
                                        onChange={(e) => setSaleForm({ ...saleForm, employeeId: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Vehicle Number */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Vehicle Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={saleForm.vehicleNumber}
                                        onChange={(e) => setSaleForm({ ...saleForm, vehicleNumber: e.target.value })}
                                        placeholder="Enter vehicle number"
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={saleForm.notes}
                                    onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                                    placeholder="Any additional notes..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={!activeShift}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    Record Sale
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </form>
                    </Card>
                ) : (
                    /* Sales History Tab */
                    <div className="space-y-6">
                        {/* Filters */}
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Sales History</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search sales..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>

                                {/* Date Filter */}
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />

                                {/* Fuel Filter */}
                                <select
                                    value={fuelFilter}
                                    onChange={(e) => setFuelFilter(e.target.value)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                >
                                    <option value="all">All Fuels</option>
                                    <option value="petrol">Petrol</option>
                                    <option value="diesel">Diesel</option>
                                    <option value="cng">CNG</option>
                                </select>

                                {/* Payment Filter */}
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                >
                                    <option value="all">All Payment Methods</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="credit">Credit</option>
                                    <option value="fleet">Fleet</option>
                                </select>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    <Filter className="w-4 h-4" />
                                    Filter
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                    <Download className="w-4 h-4" />
                                    Export
                                </button>
                            </div>
                        </Card>

                        {/* Sales Table */}
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Sale ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date & Time</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fuel</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Method</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {filteredSales.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                                    No sales records found
                                                </td>
                                            </tr>
                                        ) : (
                                            currentSales.map((sale) => (
                                                <tr key={sale._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        {sale.saleId || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        <div>{new Date(sale.date).toLocaleDateString()}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 capitalize">
                                                        {sale.fuelType}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        {sale.quantity}L
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                        ₹{sale.totalAmount?.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge className={getPaymentBadgeClass(sale.saleType)}>
                                                            {sale.saleType}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                        {sale.customerId?.name || 'Walk-in'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <button className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {filteredSales.length > 0 && (
                                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                                    <div className="text-sm text-slate-600">
                                        Showing {indexOfFirstSale + 1} to {Math.min(indexOfLastSale, filteredSales.length)} of {filteredSales.length} sales
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === i + 1
                                                        ? 'bg-orange-600 text-white'
                                                        : 'text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}