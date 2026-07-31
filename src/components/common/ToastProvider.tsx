// src/components/common/ToastProvider.tsx

import { Toaster, toast } from "react-hot-toast";

export const ToastProvider = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      error: {
        style: { color: '#dc2626', border: '1px solid #fecaca', background: '#fef2f2' },
        iconTheme: { primary: '#dc2626', secondary: '#fef2f2' },
      },
    }}
  />
);

export const showError = (msg: string) => toast.error(msg);
export const showSuccess = (msg: string) => toast.success(msg);