import axios from "axios";

const api = axios.create({
  baseURL: "https://raisoni2connect.onrender.com/api", // ✅ include /api
});

// Add a request interceptor to include token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
