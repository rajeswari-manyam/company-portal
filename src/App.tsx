// src/App.tsx

import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { ErrorBoundary, PageErrorBoundary } from "./components/common/ErrorBoundary";
import { useGlobalErrorHandler } from "./hooks/useGobalErrorHandular";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TimeTrackingProvider } from "./context/TimeTrackingContext";
import { TaskProvider } from "./context/TaskContext";

// Pages / Routers
import Login from "./pages/auth/Login";
import ChangePassword from "./pages/auth/ChangePassword";
import AdminRouter from "./pages/admin";
import HRRouter from "./pages/hr";
import EmployeeRouter from "./pages/employee";

// ── Spinner ───────────────────────────────────────────────
const Spinner = React.memo(() => (
  <div className="h-screen flex items-center justify-center">Loading...</div>
));

// ── ProtectedRoute ───────────────────────────────────────
function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role && user?.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}

// ── TrackedRoute ─────────────────────────────────────────
// Wraps routes that need TimeTracking + Task context
function TrackedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <TimeTrackingProvider userId={user?._id}>
      <TaskProvider>{children}</TaskProvider>
    </TimeTrackingProvider>
  );
}

// ── AppRoutes ────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>

        {/* ── /login ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* ── /admin/* ── */}
       <Route
  path="/admin/*"
  element={
    <ProtectedRoute role="admin">
      <TrackedRoute>
        <PageErrorBoundary>
          <AdminRouter />
        </PageErrorBoundary>
      </TrackedRoute>
    </ProtectedRoute>
  }
/>

        {/* ── /hr/* ── */}
       <Route
          path="/hr/*"
          element={
            <ProtectedRoute role="hr">
              <TrackedRoute>
                <PageErrorBoundary>
                  <HRRouter />
                </PageErrorBoundary>
              </TrackedRoute>
            </ProtectedRoute>
          }
        />


        {/* ── /employee/* ── */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute role="employee">
              <TrackedRoute>
                <PageErrorBoundary>
                  <EmployeeRouter />
                </PageErrorBoundary>
              </TrackedRoute>
            </ProtectedRoute>
          }
        />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

// ── Main App ─────────────────────────────────────────────
export default function App() {
  useGlobalErrorHandler();

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                fontFamily: "inherit",
                fontSize: "13px",
                fontWeight: 500,
              },
              success: { iconTheme: { primary: "#1a2a5e", secondary: "#fff" } },
            }}
          />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}