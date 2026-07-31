// src/hooks/useGlobalErrorHandler.ts

import { useEffect } from "react";

export const useGlobalErrorHandler = () => {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
    };

    const handleReject = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise:", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleReject);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleReject);
    };
  }, []);
};