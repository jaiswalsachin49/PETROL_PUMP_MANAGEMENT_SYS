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
    Package
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ onLogout }) {
    const auth = useAuth();
    
    const user = auth?.user || null;
    
    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
        { id: "pumps", label: "Pump Management", icon: Gauge, to: "/pumps", roles: ['admin', 'manager'] },
        { id: "tanks", label: "Tank Management", icon: Droplets, to: "/tanks", roles: ['admin', 'manager'] },
        { id: "shifts", label: "Shift Management", icon: Clock, to: "/shifts", roles: ['admin', 'manager'] },
        { id: "sales", label: "Sales Records", icon: ShoppingCart, to: "/sales" },
        { id: "employees", label: "Employee Management", icon: Users, to: "/employees", roles: ['admin', 'manager'] },
        { id: "customers", label: "Customer Records", icon: UserCircle, to: "/customers" },
        { id: "inventory", label: "Inventory", icon: Package, to: "/inventory", roles: ['admin', 'manager'] },
        { id: "reports", label: "Reports & Analytics", icon: BarChart3, to: "/reports", roles: ['admin', 'manager', 'accountant'] },
    ];

    const filteredNavItems = navItems.filter(item => {
        if (!item.roles) return true;
        if (!user) return false; 
        return item.roles.includes(user.role);
    });

    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors duration-100 ${
            isActive
                ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md"
                : "text-slate-700 hover:bg-gradient-to-r from-orange-100 to-orange-150"
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

    const getRoleBadge = (role) => {
        const badges = {
            admin: "bg-red-100 text-red-700",
            manager: "bg-blue-100 text-blue-700",
            employee: "bg-green-100 text-green-700",
            accountant: "bg-purple-100 text-purple-700"
        };
        return badges[role] || "bg-slate-100 text-slate-700";
    };

    const handleLogoutClick = () => {
        if (auth?.logout) {
            auth.logout();
        }
        if (onLogout) {
            onLogout();
        }
    };

    return (
        <aside className="w-72 bg-white border-r border-slate-200 flex flex-col relative min-h-screen">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/5 pointer-events-none"></div>
            <div className="p-6 border-b border-slate-200 relative">
                <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="FuelFlow" className="w-12 h-12" />
                    <div>
                        <h1 className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent font-semibold text-xl flex items-center gap-2">
                            FuelFlow
                        </h1>
                        <p className="text-xs text-slate-500">Management System</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <li key={item.id}>
                                <NavLink to={item.to} className={navLinkClass}>
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>

            </nav>

            {/* User Profile & Logout */}
            <div className="p-4 border-t border-slate-200 relative">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center text-white shadow-md font-semibold text-sm">
                        {getInitials(user?.username || user?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                            {user?.username || "Guest User"}
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500 truncate">
                                {user?.email || "No email"}
                            </p>
                            {user?.role && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${getRoleBadge(user.role)}`}>
                                    {user.role}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleLogoutClick}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
