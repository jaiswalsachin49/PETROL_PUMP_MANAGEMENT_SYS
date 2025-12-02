import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { organizationService } from "../services/organizationService";
import { userService } from "../services/userService";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import { Card } from "../components/ui/Card";
import AddUserModal from "../components/modals/AddUserModal";
import {
    User,
    Building2,
    Users,
    Database,
    Save,
    Upload,
    Download,
    Shield,
    Briefcase,
    UserCog,
    UserCircle2
} from "lucide-react";

export default function Settings() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [organization, setOrganization] = useState(null);
    const [users, setUsers] = useState([]);
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    // Profile state
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        address: ""
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Organization state
    const [orgData, setOrgData] = useState({
        name: "",
        gstNumber: "",
        licenseNumber: "",
        contactNumber: "",
        address: ""
    });
    const [fuelPrices, setFuelPrices] = useState({
        petrol: 96,
        diesel: 88,
        premium: 105
    });
    const [systemPreferences, setSystemPreferences] = useState({
        currency: "INR (₹)",
        dateFormat: "DD/MM/YYYY"
    });
    const [notificationSettings, setNotificationSettings] = useState({
        lowStockAlerts: true,
        paymentReminders: true
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || ""
            });
        }
        fetchOrganization();
        if (activeTab === 'users') {
            fetchUsers();
        }
    }, [user, activeTab]);

    const fetchOrganization = async () => {
        try {
            const response = await organizationService.getOrganization();
            const org = response.data.data;

            // Handle users without organization
            if (!org) {
                console.log("No organization associated with this user");
                return;
            }

            setOrganization(org);
            setOrgData({
                name: org.name,
                gstNumber: org.gstNumber || "",
                licenseNumber: org.licenseNumber || "",
                contactNumber: org.contactNumber,
                address: org.address
            });
            setFuelPrices(org.fuelPricing);
            setSystemPreferences(org.systemPreferences || {
                currency: "INR (₹)",
                dateFormat: "DD/MM/YYYY"
            });
            setNotificationSettings(org.notificationSettings || {
                lowStockAlerts: true,
                paymentReminders: true
            });
        } catch (error) {
            console.error("Error fetching organization:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await userService.getUsers();
            setUsers(response.data.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await userService.updateProfile(profileData);
            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            await userService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success("Password changed successfully");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    const handleOrgUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await organizationService.updateOrganization({
                ...orgData,
                systemPreferences,
                notificationSettings
            });
            toast.success("Settings updated successfully");
            fetchOrganization();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    const handleFuelPriceUpdate = async () => {
        setLoading(true);
        try {
            await organizationService.updateFuelPrices(fuelPrices);
            toast.success("Fuel prices updated successfully");
            fetchOrganization();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update fuel prices");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            await userService.deleteUser(userId);
            toast.success("User deleted successfully");
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete user");
        }
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            admin: "bg-purple-100 text-purple-700",
            manager: "bg-blue-100 text-blue-700",
            accountant: "bg-emerald-100 text-emerald-700",
            employee: "bg-slate-100 text-slate-700"
        };
        return colors[role] || colors.employee;
    };

    return (
        <div className="flex-1 bg-slate-50 min-h-screen pb-10">
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="px-8 py-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                        <p className="text-sm text-slate-600">Manage system settings and preferences</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
                        {[
                            { id: 'profile', label: 'Profile', icon: User },
                            { id: 'system', label: 'System Settings', icon: Building2 },
                            { id: 'users', label: 'User Management', icon: Users },
                            { id: 'backup', label: 'Backup & Data', icon: Database }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Warning for users without organization */}
                {!organization && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-yellow-800">No Organization Found</p>
                            <p className="text-xs text-yellow-700 mt-1">
                                Your account is not associated with an organization. Please create a new account through the signup page to set up your petrol pump, or contact support for assistance.
                            </p>
                        </div>
                    </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Profile Picture</h3>
                            <div className="flex flex-col items-center">
                                <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                    <UserCircle2 className="w-20 h-20 text-orange-600" />
                                </div>
                                <button className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
                                    Change Photo
                                </button>
                            </div>
                        </Card>

                        <Card className="p-6 lg:col-span-2">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h3>
                            <form onSubmit={handleProfileUpdate}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                        <input
                                            type="text"
                                            value={user?.role || ""}
                                            disabled
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                        <textarea
                                            rows={2}
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </form>
                        </Card>

                        <Card className="p-6 lg:col-span-3">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Change Password</h3>
                            <form onSubmit={handlePasswordChange}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50"
                                >
                                    Update Password
                                </button>
                            </form>
                        </Card>
                    </div>
                )}

                {/* System Settings Tab */}
                {activeTab === 'system' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Information</h3>
                            <form onSubmit={handleOrgUpdate}>
                                <div className="space-y-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                                        <input
                                            type="text"
                                            value={orgData.name}
                                            onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">GST Number</label>
                                        <input
                                            type="text"
                                            value={orgData.gstNumber}
                                            onChange={(e) => setOrgData({ ...orgData, gstNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                                        <input
                                            type="text"
                                            value={orgData.licenseNumber}
                                            onChange={(e) => setOrgData({ ...orgData, licenseNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                                        <input
                                            type="tel"
                                            value={orgData.contactNumber}
                                            onChange={(e) => setOrgData({ ...orgData, contactNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                        <textarea
                                            rows={3}
                                            value={orgData.address}
                                            onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || user?.role !== 'admin'}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save Settings
                                </button>
                            </form>
                        </Card>

                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Fuel Pricing</h3>
                                <div className="space-y-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Petrol Rate (per Liter)</label>
                                        <input
                                            type="number"
                                            value={fuelPrices.petrol}
                                            onChange={(e) => setFuelPrices({ ...fuelPrices, petrol: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Diesel Rate (per Liter)</label>
                                        <input
                                            type="number"
                                            value={fuelPrices.diesel}
                                            onChange={(e) => setFuelPrices({ ...fuelPrices, diesel: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Premium Rate (per Liter)</label>
                                        <input
                                            type="number"
                                            value={fuelPrices.premium}
                                            onChange={(e) => setFuelPrices({ ...fuelPrices, premium: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    {organization?.fuelPricing?.lastUpdated && (
                                        <p className="text-xs text-slate-500">
                                            Last updated: {new Date(organization.fuelPricing.lastUpdated).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleFuelPriceUpdate}
                                    disabled={loading || !['admin', 'manager'].includes(user?.role)}
                                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50"
                                >
                                    Update Prices
                                </button>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">System Preferences</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                                        <select
                                            value={systemPreferences.currency}
                                            onChange={(e) => setSystemPreferences({ ...systemPreferences, currency: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option>INR (₹)</option>
                                            <option>USD ($)</option>
                                            <option>EUR (€)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Date Format</label>
                                        <select
                                            value={systemPreferences.dateFormat}
                                            onChange={(e) => setSystemPreferences({ ...systemPreferences, dateFormat: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option>DD/MM/YYYY</option>
                                            <option>MM/DD/YYYY</option>
                                            <option>YYYY-MM-DD</option>
                                        </select>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification Settings</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">Low Stock Alerts</p>
                                            <p className="text-xs text-slate-500">Get notified when stock is low</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.lowStockAlerts}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockAlerts: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-700">Payment Reminders</p>
                                            <p className="text-xs text-slate-500">Overdue payment notifications</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={notificationSettings.paymentReminders}
                                            onChange={(e) => setNotificationSettings({ ...notificationSettings, paymentReminders: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <div>
                        <Card className="p-6 mb-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-slate-900">User Accounts</h3>
                                {['admin', 'manager'].includes(user?.role) && (
                                    <button
                                        onClick={() => setShowAddUserModal(true)}
                                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Users className="w-4 h-4" />
                                        Add New User
                                    </button>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {users.map((u) => (
                                            <tr key={u._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-orange-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900">{u.name || u.username}</p>
                                                            <p className="text-xs text-slate-500">{u.username}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{u.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(u.role)}`}>
                                                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {user?.role === 'admin' && u._id !== user._id && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Delete user "${u.name || u.username}"? This action cannot be undone.`)) {
                                                                    handleDeleteUser(u._id);
                                                                }
                                                            }}
                                                            className="text-red-600 hover:text-red-800 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { role: 'Administrator', icon: Shield, desc: 'Full access to all features and settings', color: 'purple' },
                                { role: 'Manager', icon: Briefcase, desc: 'Access to operations and reports', color: 'blue' },
                                { role: 'Accountant', icon: UserCog, desc: 'Access to finance and reports only', color: 'emerald' },
                                { role: 'Employee', icon: UserCircle2, desc: 'Limited access to sales and attendance', color: 'slate' }
                            ].map((item, idx) => (
                                <Card key={idx} className="p-4">
                                    <div className={`p-3 bg-${item.color}-100 rounded-lg w-fit mb-3`}>
                                        <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                                    </div>
                                    <h4 className="font-semibold text-slate-900 mb-1">{item.role}</h4>
                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Backup & Data Tab */}
                {activeTab === 'backup' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Database Backup</h3>
                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg mb-4">
                                <p className="text-sm text-orange-900"><strong>Last Backup:</strong></p>
                                <p className="text-sm text-orange-700">November 11, 2025 at 2:00 AM</p>
                            </div>
                            <button className="w-full mb-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors flex items-center justify-center gap-2">
                                <Upload className="w-4 h-4" />
                                Create Backup Now
                            </button>
                            <button className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors">
                                Schedule Automatic Backup
                            </button>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Export Data</h3>
                            <div className="space-y-3">
                                {[
                                    'Export Sales Data',
                                    'Export Customer Data',
                                    'Export Inventory Data',
                                    'Export Financial Reports',
                                    'Export All Data'
                                ].map((label, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors text-left flex items-center justify-between group"
                                    >
                                        {label}
                                        <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                                    </button>
                                ))}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            <AddUserModal
                isOpen={showAddUserModal}
                onClose={() => setShowAddUserModal(false)}
                onUserAdded={fetchUsers}
                currentUserRole={user?.role}
            />
        </div>
    );
}
