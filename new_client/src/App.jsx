import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tanks from './pages/Tanks';
// import Pumps from './pages/Pumps';
// import Employees from './pages/Employees';
// import Customers from './pages/Customers';
// import Sales from './pages/Sales';
// import Shifts from './pages/Shifts';
// import Reports from './pages/Reports';

import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/protectedRoute';

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
            // <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tanks" element={<Tanks />} />
                  {/* <Route path="/pumps" element={<Pumps />} /> */}
                  {/* <Route path="/employees" element={<Employees />} /> */}
                  {/* <Route path="/customers" element={<Customers />} /> */}
                  {/* <Route path="/sales" element={<Sales />} />  */}
                  {/* <Route path="/shifts" element={<Shifts />} /> */}
                  {/* <Route path="/reports" element={<Reports />} /> */}
                </Routes>
              </MainLayout>
            // </ProtectedRoute>
          } />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;
