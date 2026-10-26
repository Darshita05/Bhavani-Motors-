const CUSTOM_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const API_BASE_URL =
  CUSTOM_BACKEND_URL && !CUSTOM_BACKEND_URL.includes("garage-admin-panel-backend.onrender.com")
    ? CUSTOM_BACKEND_URL
    : import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://bhavani-motors-backend.vercel.app";