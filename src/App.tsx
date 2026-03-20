// src/App.tsx

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

// ── Session key (must match AuthContext / Auth.service) ────────────────────────
const PENDING_USER_ID_KEY = 'pending_userId';

// ── Spinner ────────────────────────────────────────────────────────────────────
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

// ── ProtectedRoute ─────────────────────────────────────────────────────────────
/** Guards a route: must be fully logged in with the correct role */
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

  const getDashboard = (role?: string) => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'hr')    return '/hr/dashboard';
    return '/employee/dashboard';
  };

  // Wrong role → redirect to their own dashboard
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={getDashboard(user?.role)} replace />;
  }

  return <>{children}</>;
}

// ── TrackedRoute ───────────────────────────────────────────────────────────────
/** Wraps HR / Employee routes with time-tracking and task context */
function TrackedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <TimeTrackingProvider userId={user?._id}>   {/* ✅ _id not id */}
      <TaskProvider>{children}</TaskProvider>
    </TimeTrackingProvider>
  );
}

// ── AppRoutes ──────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;

  /**
   * ✅ isPendingPasswordChange:
   * During first-login flow, AuthContext does NOT set `user` in state.
   * It only stores `pending_userId` in sessionStorage.
   * So we must check sessionStorage — not `user` — to know if we're mid-flow.
   */
 // With this (checks both):
const isPendingPasswordChange =
  !!sessionStorage.getItem(PENDING_USER_ID_KEY) ||
  !!localStorage.getItem('fl_pending_userId');

  /** Resolve the correct home path for the current auth state */
  const home = (): string => {
    if (isPendingPasswordChange)  return '/change-password';
    if (!isAuthenticated)         return '/login';
    if (user?.role === 'admin')   return '/admin/dashboard';
    if (user?.role === 'hr')      return '/hr/dashboard';
    return '/employee/dashboard';
  };

  return (
    <Routes>

      {/* ── /login ──────────────────────────────────────────────────────────── */}
      {/*  • Already logged in           → go to their dashboard                */}
      {/*  • Mid-password-change flow    → go to /change-password               */}
      {/*  • Otherwise                   → show login form                      */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={home()} replace />
            : isPendingPasswordChange
              ? <Navigate to="/change-password" replace />
              : <Login />
        }
      />

      {/* ── /change-password ────────────────────────────────────────────────── */}
      {/*  ✅ Allow access if:                                                   */}
      {/*     (a) pending_userId in sessionStorage  → first-login flow           */}
      {/*     (b) fully authenticated               → profile password change    */}
      {/*  ❌ Otherwise → back to /login                                         */}
      <Route
        path="/change-password"
        element={
          isAuthenticated || isPendingPasswordChange
            ? <ChangePassword />
            : <Navigate to="/login" replace />
        }
      />

      {/* ── /admin/* ─────────────────────────────────────────────────────────── */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminRouter />
          </ProtectedRoute>
        }
      />

      {/* ── /hr/* ────────────────────────────────────────────────────────────── */}
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

      {/* ── /employee/* ──────────────────────────────────────────────────────── */}
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

      {/* ── Catch-all ────────────────────────────────────────────────────────── */}
      <Route path="/"  element={<Navigate to={home()} replace />} />
      <Route path="*"  element={<Navigate to={home()} replace />} />

    </Routes>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
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