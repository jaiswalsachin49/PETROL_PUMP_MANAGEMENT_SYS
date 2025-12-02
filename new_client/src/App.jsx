import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tanks from './pages/Tanks';
import Pumps from './pages/Pumps';
import Employees from './pages/Employees';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Shifts from './pages/Shifts';
import Reports from './pages/AnalyticsReports';
import Inventory from './pages/Inventory';
import Attendance from './pages/Attendance';
import Tank from './pages/Tanks';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Transactions from './pages/Transactions';
import Expenses from './pages/Expenses';
import Credit from './pages/Credit';
import Analytics from './pages/Analytics';
import Reconciliation from './pages/Reconciliation';
import Settings from './pages/Settings';

import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

function MainLayout({ children }) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tanks" element={<Tanks />} />
                  <Route path="/pumps" element={<Pumps />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/shifts" element={<Shifts />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path='/inventory' element={<Inventory />} />
                  <Route path='/attendance' element={<Attendance />} />
                  <Route path='/tanks' element={<Tank />} />
                  <Route path='/suppliers' element={<Suppliers />} />
                  <Route path='/purchases' element={<Purchases />} />
                  <Route path='/transactions' element={<Transactions />} />
                  <Route path='/expenses' element={<Expenses />} />
                  <Route path='/credit' element={<Credit />} />
                  <Route path='/analytics' element={<Analytics />} />
                  <Route path='/reconciliation' element={<Reconciliation />} />
                  <Route path='/settings' element={<Settings />} />

                </Routes>
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;
