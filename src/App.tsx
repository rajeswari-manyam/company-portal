import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TimeTrackingProvider } from './context/TimeTrackingContext';
import { TaskProvider } from './context/TaskContext';

import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';
import AdminRouter from './pages/admin/index';
import HRRouter from './pages/hr/index';
import EmployeeRouter from './pages/employee/index';

function Spinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#f0f2f7]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#1a2a5e] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-medium tracking-wider uppercase">Loading…</p>
      </div>
    </div>
  );
}

/** Guards a route: must be logged in, NOT mid-password-change, and correct role */
function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'hr' | 'employee';
}) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Force first-time password change for HR and Employee
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;

  const getDashboard = (role?: string) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'hr') return '/hr/dashboard';
    return '/employee/dashboard';
  };

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={getDashboard(user?.role)} replace />;
  }

  return <>{children}</>;
}

function TrackedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <TimeTrackingProvider userId={user?.id}>
      <TaskProvider>{children}</TaskProvider>
    </TimeTrackingProvider>
  );
}

function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;

  const home = () => {
    if (!isAuthenticated) return '/login';
    if (user?.mustChangePassword) return '/change-password';
    if (user?.role === 'admin') return '/admin/dashboard';
    if (user?.role === 'hr') return '/hr/dashboard';
    return '/employee/dashboard';
  };

  return (
    <Routes>
      {/* Public — login page: redirect away if already logged in (and password is set) */}
      <Route
        path="/login"
        element={
          isAuthenticated && !user?.mustChangePassword
            ? <Navigate to={home()} replace />
            : <Login />
        }
      />

      {/* First-time password change — requires authentication */}
      <Route
        path="/change-password"
        element={
          !isAuthenticated
            ? <Navigate to="/login" replace />
            : <ChangePassword />
        }
      />

      {/* Admin — full access, no time tracking */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminRouter />
          </ProtectedRoute>
        }
      />

      {/* HR — with time + task tracking */}
      <Route
        path="/hr/*"
        element={
          <ProtectedRoute requiredRole="hr">
            <TrackedRoute>
              <HRRouter />
            </TrackedRoute>
          </ProtectedRoute>
        }
      />

      {/* Employee — with time + task tracking */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute requiredRole="employee">
            <TrackedRoute>
              <EmployeeRouter />
            </TrackedRoute>
          </ProtectedRoute>
        }
      />

      {/* Catch-all → home */}
      <Route path="/" element={<Navigate to={home()} replace />} />
      <Route path="*" element={<Navigate to={home()} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#1a2a5e', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
