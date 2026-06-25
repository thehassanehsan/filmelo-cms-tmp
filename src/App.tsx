import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminClients from '@/pages/admin/Clients';
import AdminSales from '@/pages/admin/Sales';
import AdminAccounting from '@/pages/admin/Accounting';
import AdminSchedule from '@/pages/admin/Schedule';
import AdminTasks from '@/pages/admin/Tasks';
import AdminProfessionals from '@/pages/admin/Professionals';
import AdminAttendance from '@/pages/admin/Attendance';
import AdminReports from '@/pages/admin/Reports';
import AdminClientReports from '@/pages/admin/ClientReports';
import AdminSettings from '@/pages/admin/Settings';
import ProDashboard from '@/pages/professional/Dashboard';
import ClientDashboard from '@/pages/client/Dashboard';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="text-[#CFFF4A] text-2xl font-bold animate-pulse">FM</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role}/dashboard`} replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
      <Route path="/admin/clients" element={user?.role === 'admin' ? <AdminClients /> : <Navigate to="/login" />} />
      <Route path="/admin/sales" element={user?.role === 'admin' ? <AdminSales /> : <Navigate to="/login" />} />
      <Route path="/admin/accounting" element={user?.role === 'admin' ? <AdminAccounting /> : <Navigate to="/login" />} />
      <Route path="/admin/schedule" element={user?.role === 'admin' ? <AdminSchedule /> : <Navigate to="/login" />} />
      <Route path="/admin/tasks" element={user?.role === 'admin' ? <AdminTasks /> : <Navigate to="/login" />} />
      <Route path="/admin/professionals" element={user?.role === 'admin' ? <AdminProfessionals /> : <Navigate to="/login" />} />
      <Route path="/admin/attendance" element={user?.role === 'admin' ? <AdminAttendance /> : <Navigate to="/login" />} />
      <Route path="/admin/reports" element={user?.role === 'admin' ? <AdminReports /> : <Navigate to="/login" />} />
      <Route path="/admin/client-reports" element={user?.role === 'admin' ? <AdminClientReports /> : <Navigate to="/login" />} />
      <Route path="/admin/settings" element={user?.role === 'admin' ? <AdminSettings /> : <Navigate to="/login" />} />

      {/* Professional routes */}
      <Route path="/professional/dashboard" element={user?.role === 'professional' ? <ProDashboard /> : <Navigate to="/login" />} />

      {/* Client routes */}
      <Route path="/client/dashboard" element={user?.role === 'client' ? <ClientDashboard /> : <Navigate to="/login" />} />

      {/* Fallback */}
      <Route path="/" element={<Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
