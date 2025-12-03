
import React, { useState, useEffect } from "react";
import { inventoryService } from "../services/inventoryService";
import { supplierService } from "../services/supplierService";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from 'react-toastify';
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import {
    Search,
    Filter,
    Download,
    Plus,
    X,
    Edit,
    Trash2,
    Package,
    AlertTriangle,
    CheckCircle,
    Box
} from "lucide-react";

export default function Inventory() {
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [formData, setFormData] = useState({
        itemName: "",
        category: "lubricant",
        quantity: 0,
        unit: "piece",
        costPrice: 0,
        sellingPrice: 0,
        reorderLevel: 10,
        supplierId: "",
        location: "",
        expiryDate: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [inventoryRes, supplierRes] = await Promise.all([
                inventoryService.getAll(),
                supplierService.getAll()
            ]);
            setItems(inventoryRes.data.data || []);
            setSuppliers(supplierRes.data.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await inventoryService.create(formData);
            setShowCreateModal(false);
            resetForm();
            fetchData();
            toast.success("Item created successfully!");
        } catch (error) {
            console.error("Error creating item:", error);
            toast.error(error.response?.data?.message || "Error creating item");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await inventoryService.update(selectedItem._id, formData);
            setShowEditModal(false);
            resetForm();
            fetchData();
            toast.success("Item updated successfully!");
        } catch (error) {
            console.error("Error updating item:", error);
            toast.error(error.response?.data?.message || "Error updating item");
        }
    };

    const openEditModal = (item) => {
        setSelectedItem(item);
        setFormData({
            itemName: item.itemName,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            reorderLevel: item.reorderLevel,
            supplierId: item.supplierId || "",
            location: item.location || "",
            expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : ""
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            itemName: "",
            category: "lubricant",
            quantity: 0,
            unit: "piece",
            costPrice: 0,
            sellingPrice: 0,
            reorderLevel: 10,
            supplierId: "",
            location: "",
            expiryDate: ""
        });
        setSelectedItem(null);
    };

    const getFilteredItems = () => {
        if (!searchTerm) return items;
        const lowerTerm = searchTerm.toLowerCase();
        return items.filter(i =>
            i.itemName.toLowerCase().includes(lowerTerm) ||
            i.itemId?.toLowerCase().includes(lowerTerm) ||
            i.category.toLowerCase().includes(lowerTerm)
        );
    };

    const filteredItems = getFilteredItems();

    // Stats
    const totalItems = items.length;
    const lowStockItems = items.filter(i => i.quantity <= i.reorderLevel).length;
    const inStockItems = totalItems - lowStockItems;

    const getCategoryBadge = (category) => {
        switch (category) {
            case 'lubricant': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Lubricants</Badge>;
            case 'accessory': return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Accessories</Badge>;
            case 'spare_part': return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Parts</Badge>;
            case 'consumable': return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Consumables</Badge>;
            default: return <Badge className="bg-slate-100 text-slate-700 border-slate-200">{category}</Badge>;
        }
    };

    if (loading && !items.length) {
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
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-slate-900 flex items-center gap-2">
                                    Inventory Management
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Track spare parts and supplies</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Item
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Box className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Total Items</p>
                                <p className="text-2xl font-bold text-slate-900">{totalItems}</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">In Stock</p>
                                <p className="text-2xl font-bold text-slate-900">{inStockItems}</p>
                            </div>
                        </Card>
                        <Card className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Low Stock</p>
                                <p className="text-2xl font-bold text-slate-900">{lowStockItems}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex items-center justify-between">
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-8">
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Item ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reorder Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr key={item._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                                {item.itemId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                                {item.itemName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getCategoryBadge(item.category)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                                                {item.quantity} {item.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {item.reorderLevel} {item.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {item.quantity <= item.reorderLevel ? (
                                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200">Low Stock</Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">In Stock</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="text-slate-600 hover:text-orange-600 transition-colors mr-3"
                                                >
                                                    Restock
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="text-slate-600 hover:text-orange-600 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                            No items found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {showCreateModal ? "Add New Item" : "Edit Item"}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setShowEditModal(false);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={showCreateModal ? handleCreateSubmit : handleEditSubmit} className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-slate-900 border-b pb-2">Basic Information</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.itemName}
                                            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="lubricant">Lubricant</option>
                                            <option value="accessory">Accessory</option>
                                            <option value="spare_part">Spare Part</option>
                                            <option value="consumable">Consumable</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                                        <select
                                            value={formData.unit}
                                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="piece">Piece</option>
                                            <option value="liter">Liter</option>
                                            <option value="kg">Kg</option>
                                            <option value="box">Box</option>
                                            <option value="packet">Packet</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                                        <select
                                            value={formData.supplierId}
                                            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Select Supplier</option>
                                            {suppliers.map(s => (
                                                <option key={s._id} value={s._id}>{s.name} ({s.companyName})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-medium text-slate-900 border-b pb-2">Stock & Pricing</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Reorder Level</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.reorderLevel}
                                                onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.costPrice}
                                                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price (₹)</label>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={formData.sellingPrice}
                                                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="e.g. Shelf A1"
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 mt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setShowEditModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    {showCreateModal ? "Create Item" : "Update Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}