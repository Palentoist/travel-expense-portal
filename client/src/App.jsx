import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitClaim from './pages/SubmitClaim';
import ClaimDetail from './pages/ClaimDetail';
import MyHistory from './pages/MyHistory';
import ApprovalQueue from './pages/ApprovalQueue';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Employee routes */}
          <Route path="/claims/new"  element={<ProtectedRoute roles={['employee']} />}>
            <Route index element={<SubmitClaim />} />
          </Route>
          <Route path="/my-claims"  element={<ProtectedRoute roles={['employee']} />}>
            <Route index element={<MyHistory />} />
          </Route>

          {/* Shared claim detail */}
          <Route path="/claims/:id" element={<ClaimDetail />} />

          {/* Manager routes */}
          <Route path="/approvals" element={<ProtectedRoute roles={['manager', 'admin']} />}>
            <Route index element={<ApprovalQueue />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<AdminDashboard />} />
          </Route>
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<UserManagement />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
