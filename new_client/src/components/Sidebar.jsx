import {
    LayoutDashboard,
    Fuel,
    ShoppingCart,
    Users,
    UserCircle,
    BarChart3,
    Gauge,
    Settings,
    LogOut,
    Droplets,
    Sparkles,
    Clock,
    Package,
    Truck,
    Wallet,
    CreditCard,
    FileText,
    PieChart,
    ClipboardCheck,
    ChevronDown,
    ChevronRight,
    Settings as SettingsIcon
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Sidebar({ onLogout }) {
    const auth = useAuth();
    const user = auth?.user || null;


    // State for collapsible sections
    const [expandedGroups, setExpandedGroups] = useState({
        operations: true,
        masters: true,
        finance: true,
        reports: true
    });

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const navGroups = [
        {
            id: "operations",
            label: "Operations",
            icon: Clock,
            items: [
                { id: "shifts", label: "Shifts", icon: Clock, to: "/shifts", roles: ['admin', 'manager'] },
                { id: "sales", label: "Sales", icon: ShoppingCart, to: "/sales" },
                { id: "attendance", label: "Attendance", icon: Users, to: "/attendance", roles: ['admin', 'manager'] },
                { id: "tanks", label: "Tanks", icon: Droplets, to: "/tanks", roles: ['admin', 'manager'] },
                { id: "pumps", label: "Pumps", icon: Gauge, to: "/pumps", roles: ['admin', 'manager'] },
            ]
        },
        {
            id: "masters",
            label: "Masters",
            icon: Package,
            items: [
                { id: "customers", label: "Customers", icon: UserCircle, to: "/customers" },
                { id: "employees", label: "Employees", icon: Users, to: "/employees", roles: ['admin', 'manager'] },
                { id: "suppliers", label: "Suppliers", icon: Truck, to: "/suppliers", roles: ['admin', 'manager'] },
                { id: "inventory", label: "Inventory", icon: Package, to: "/inventory", roles: ['admin', 'manager'] },
                { id: "purchases", label: "Purchases", icon: ShoppingCart, to: "/purchases", roles: ['admin', 'manager'] },
            ]
        },
        {
            id: "finance",
            label: "Finance",
            icon: Wallet,
            items: [
                { id: "transactions", label: "Transactions", icon: CreditCard, to: "/transactions", roles: ['admin', 'manager'] },
                { id: "expenses", label: "Expenses", icon: Wallet, to: "/expenses", roles: ['admin', 'manager'] },
                { id: "credit", label: "Credit Management", icon: FileText, to: "/credit", roles: ['admin', 'manager'] },
            ]
        },
        {
            id: "reports",
            label: "Reports & Analytics",
            icon: BarChart3,
            items: [
                { id: "reports-list", label: "Reports", icon: FileText, to: "/reports", roles: ['admin', 'manager', 'accountant'] },
                { id: "analytics", label: "Analytics", icon: BarChart3, to: "/analytics", roles: ['admin', 'manager'] },
                { id: "reconciliation", label: "Reconciliation", icon: ClipboardCheck, to: "/reconciliation", roles: ['admin', 'manager'] },
            ]
        }
    ];

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${isActive
            ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md font-medium"
            : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
        }`;

    const getInitials = (name) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLogoutClick = () => {
        if (auth?.logout) auth.logout();
        if (onLogout) onLogout();
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shadow-xl z-50">
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="FuelFlow" className="w-10 h-10" />
                    <div>
                        <h1 className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent font-bold text-xl tracking-tight">
                            FuelFlow
                        </h1>
                        <p className="text-xs text-slate-400 font-medium">{user?.role?.toUpperCase()}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                <div className="space-y-1">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-4 transition-all ${isActive
                                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                                : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                            }`
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Dashboard</span>
                    </NavLink>

                    {navGroups.map((group) => (
                        <div key={group.id} className="mb-2">
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-orange-500 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <span>{group.label}</span>
                                </div>
                                {expandedGroups[group.id] ? (
                                    <ChevronDown className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                )}
                            </button>

                            {expandedGroups[group.id] && (
                                <div className="mt-1 space-y-0.5 pl-2">
                                    {group.items.map((item) => {
                                        // Filter by role
                                        if (item.roles && user && !item.roles.includes(user.role)) return null;

                                        const Icon = item.icon;
                                        return (
                                            <NavLink
                                                key={item.id}
                                                to={item.to}
                                                className={navLinkClass}
                                            >
                                                <Icon className="w-4 h-4 opacity-80" />
                                                <span>{item.label}</span>
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-4 transition-all ${isActive
                                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                                : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                            }`
                        }
                    >
                        <SettingsIcon className="w-5 h-5" />
                        <span>Settings</span>
                    </NavLink>
                </div>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-md">
                        {getInitials(user?.username || user?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {user?.username || "Guest User"}
                        </p>
                        <p className="text-xs text-slate-500 truncate capitalize">
                            {user?.role || "Staff"}
                        </p>
                    </div>
                    <button
                        onClick={handleLogoutClick}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
