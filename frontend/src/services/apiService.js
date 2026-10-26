import axios from "axios";
import { handleMockApiRequest } from "./mockApiRouter";

const CUSTOM_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const isDev = import.meta.env.MODE === "development";

const DEFAULT_PROD_BACKEND = "https://bhavani-motors-backend.vercel.app";

const API_BASE_URL =
  CUSTOM_BACKEND_URL && !CUSTOM_BACKEND_URL.includes("garage-admin-panel-backend.onrender.com")
    ? CUSTOM_BACKEND_URL
    : isDev
    ? "http://localhost:5000"
    : DEFAULT_PROD_BACKEND;

const USE_NETWORK = true;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token && !config.url?.includes("/auth/")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("jwtToken");
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  get: async (endpoint, params = {}) => {
    if (!USE_NETWORK) {
      return handleMockApiRequest("GET", endpoint, params);
    }
    try {
      return (await apiClient.get(endpoint, { params })).data;
    } catch (err) {
      if (err.response) throw err;
      console.warn("Network fetch fallback to new local project data:", endpoint);
      return handleMockApiRequest("GET", endpoint, params);
    }
  },

  post: async (endpoint, data) => {
    if (!USE_NETWORK) {
      return handleMockApiRequest("POST", endpoint, data);
    }
    try {
      return (await apiClient.post(endpoint, data)).data;
    } catch (err) {
      if (err.response) throw err;
      console.warn("Network post fallback to new local project data:", endpoint);
      return handleMockApiRequest("POST", endpoint, data);
    }
  },

  put: async (endpoint, data) => {
    if (!USE_NETWORK) {
      return handleMockApiRequest("PUT", endpoint, data);
    }
    try {
      return (await apiClient.put(endpoint, data)).data;
    } catch (err) {
      if (err.response) throw err;
      console.warn("Network put fallback to new local project data:", endpoint);
      return handleMockApiRequest("PUT", endpoint, data);
    }
  },

  patch: async (endpoint, data) => {
    if (!USE_NETWORK) {
      return handleMockApiRequest("PATCH", endpoint, data);
    }
    try {
      return (await apiClient.patch(endpoint, data)).data;
    } catch (err) {
      if (err.response) throw err;
      console.warn("Network patch fallback to new local project data:", endpoint);
      return handleMockApiRequest("PATCH", endpoint, data);
    }
  },

  delete: async (endpoint, config = {}) => {
    if (!USE_NETWORK) {
      return handleMockApiRequest("DELETE", endpoint, config);
    }
    try {
      return (await apiClient.delete(endpoint, config)).data;
    } catch (err) {
      if (err.response) throw err;
      console.warn("Network delete fallback to new local project data:", endpoint);
      return handleMockApiRequest("DELETE", endpoint, config);
    }
  },

  upload: async (endpoint, formData) => {
    if (!USE_NETWORK) {
      return { success: true, message: "Image uploaded successfully", imageUrl: "https://placehold.co/600x400" };
    }
    try {
      return (await apiClient.post(endpoint, formData)).data;
    } catch (err) {
      return { success: true, imageUrl: "https://placehold.co/600x400" };
    }
  },
};

export default apiService;