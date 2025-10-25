import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(credentials);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: 'url("/petrolpump.jpg")' }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8 text-white">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="FuelFlow" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-semibold text-center">
            Welcome <br />
            <span className="font-bold text-orange-400">FUEL FLOW</span>
          </h1>
          <p className="text-sm text-gray-200 mt-1">Management System</p>
        </div>


        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-400/40 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-300" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}


        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
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

          <div className="flex justify-between items-center text-sm text-gray-300">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2 accent-orange-500" />
              Remember me
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-medium shadow-md transition-all duration-300"
          >
            {loading ? 'Signing In...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 p-2 bg-white rounded-xl"> 
          <p className="text-xs font-medium text-orange-900 mb-2">Demo Credentials:</p> 
            <div className="space-y-1 text-xs text-orange-700"> 
              <p><strong>Admin:</strong> admin@gmail.com / Admin123</p> 
            </div> 
          </div> 

      <div className="px-8 pt-6"> <p className="text-xs text-center text-slate-500"> © 2025 FuelFlow. All rights reserved. </p> </div>
    </div>
    </div >
  );
}
