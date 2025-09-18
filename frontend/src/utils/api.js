import axios from "axios";

const api = axios.create({
  baseURL: "https://raisoni2connect-rc.onrender.com/api", // all routes will be under /api
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
