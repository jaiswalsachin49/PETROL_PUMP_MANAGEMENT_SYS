import React, { useState } from 'react';
import { Mail, Lock, User, Phone, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'employee',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login({ email: credentials.email, password: credentials.password });
        navigate('/dashboard');
      } else {
        await register(credentials);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center relative"
      style={{ backgroundImage: 'url("/petrolpump.jpg")' }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8 text-white">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="FuelFlow" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-semibold text-center">
            Welcome to <span className="font-bold text-orange-400">FUEL FLOW</span>
          </h1>
          <p className="text-sm text-gray-200 mt-1">Management System</p>
        </div>
        <div className="relative flex mb-8 bg-white/10 rounded-full border border-white/20 overflow-hidden">
          <div
            className={`absolute top-0 bottom-0 w-1/2 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(255,165,0,0.5)] transition-all duration-500 ${
              tab === 'signup' ? 'translate-x-full' : 'translate-x-0'
            }`}
          ></div>
          <button
            onClick={() => setTab('login')}
            className={`relative flex-1 py-2.5 font-medium z-10 transition-all duration-500 ${
              tab === 'login' ? 'text-white scale-105' : 'text-gray-300 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`relative flex-1 py-2.5 font-medium z-10 transition-all duration-500 ${
              tab === 'signup' ? 'text-white scale-105' : 'text-gray-300 hover:text-white'
            }`}
          >
            Signup
          </button>
        </div>
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-400/40 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-300" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          {tab === 'signup' && (
            <>
              {/* Username */}
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                  <input
                    type="text"
                    name="username"
                    placeholder="JohnDoe123"
                    value={credentials.username}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none placeholder-gray-300 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="9876543210"
                    value={credentials.phone}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none placeholder-gray-300 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                  <select
                    name="role"
                    value={credentials.role}
                    onChange={handleChange}
                    className="w-full appearance-none pl-10 pr-4 py-2.5 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-white"
                  >
                    <option value="employee" className="bg-slate-800 text-white">
                      Employee
                    </option>
                    <option value="admin" className="bg-slate-800 text-white">
                      Admin
                    </option>
                    <option value="manager" className="bg-slate-800 text-white">
                      Manager
                    </option>
                  </select>
                </div>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input
                type="email"
                name="email"
                placeholder="admin@fuelflow.com"
                value={credentials.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none placeholder-gray-300 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none placeholder-gray-300 text-white"
              />
            </div>
          </div>

          {tab === 'login' && (
            <div className="flex justify-between items-center text-sm text-gray-300">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2 accent-orange-500" />
                Remember me
              </label>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-medium shadow-md transition-all duration-300 active:scale-[0.98]"
          >
            {loading
              ? tab === 'login'
                ? 'Signing In...'
                : 'Creating Account...'
              : tab === 'login'
              ? 'Login'
              : 'Signup'}
          </button>
        </form>

        {/* Demo credentials (only for login) */}
        {tab === 'login' && (
          <div className="mt-6 p-2 bg-white rounded-xl">
            <p className="text-xs font-medium text-orange-900 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-orange-700">
              <p>
                <strong>Admin:</strong> admin@gmail.com / Admin123
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 pt-6">
          <p className="text-xs text-center text-slate-500">
            © 2025 FuelFlow. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
