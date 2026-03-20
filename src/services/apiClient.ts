import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://192.168.1.5:3000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ✅ Response interceptor (optional)
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API Error:", err.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default apiClient;