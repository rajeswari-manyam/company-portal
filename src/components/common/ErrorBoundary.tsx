// src/components/common/ErrorBoundary.tsx

import React, { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);

    this.props.onError?.(error, info);

    if (import.meta.env.PROD) {
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: info.componentStack,
        }),
      });
    }
  }

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isLogin = window.location.pathname === "/login";

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f2f7] p-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md w-full">
            <AlertTriangle className="text-red-500 mx-auto mb-4" size={30} />

            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-4">
              Please try again or go to login.
            </p>

            {this.state.error && (
              <p className="text-xs text-red-400 bg-red-50 p-2 rounded mb-4">
                {this.state.error.message}
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#1a2a5e] text-white rounded-lg"
              >
                <RefreshCw size={14} /> Retry
              </button>

              <button
                onClick={() =>
                  isLogin
                    ? window.location.reload()
                    : window.location.replace("/login")
                }
                className="px-4 py-2 border rounded-lg"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

// Page Boundary
export const PageErrorBoundary = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary
    fallback={
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="text-amber-400 mb-2" size={28} />
        <p>Page crashed</p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 underline mt-2"
        >
          Reload
        </button>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);