// src/service/apiClient.ts

import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response handling
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;

    console.error("API Error:", err.response?.data || err.message);

    if (status === 401) {
      localStorage.removeItem("auth_token");
      window.location.replace("/login");
    }

    if (!err.response) console.error("Network error");

    if (err.code === "ECONNABORTED") console.error("Timeout error");

    return Promise.reject(err);
  }
);

export default apiClient;