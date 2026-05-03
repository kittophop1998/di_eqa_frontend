import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080")
    : (process.env.API_BASE || "http://backend:8080");

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------- Request interceptor: attach Bearer token ----------
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("di_eqa_token");
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------- Response interceptor: normalise errors ----------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    const data = error.response?.data;
    const msg =
      (data && (data.error || data.message)) ||
      error.response?.statusText ||
      error.message;
    return Promise.reject(new Error(msg));
  }
);

export default axiosInstance;
