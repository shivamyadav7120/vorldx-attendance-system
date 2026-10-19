
import axios from "axios";

export const TOKEN_KEY = "vorldx_token";
export const USER_KEY = "vorldx_user";

export const getToken = () =>
  localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

export function clearSession() {
  for (const store of [localStorage, sessionStorage]) {
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = String(error?.config?.url || "").includes("/auth/login");

    if (error?.response?.status === 401 && getToken() && !isLogin) {
      clearSession();

      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export function errorMessage(error) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (status === 401) return "Invalid email or password.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status >= 500) return "Backend server error. Please try again.";

  if (error?.code === "ECONNABORTED") {
    return "Request timed out. Please check your connection.";
  }

  if (error?.message === "Network Error") {
    return "Cannot connect to the backend. Check that port 5000 is running.";
  }

  return error?.message || "Something went wrong. Please try again.";
}

export default api;
