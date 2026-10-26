const sanitizeBackendUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const clean = url.trim().replace(/\/+$/, "");
  if (clean.includes("bhavani-motors-backend") && clean.includes(".vercel.app")) {
    return "https://bhavani-motors-backend.vercel.app";
  }
  return clean;
};

const rawBackendUrl = import.meta.env.VITE_BACKEND_URL;
const CUSTOM_BACKEND_URL = sanitizeBackendUrl(rawBackendUrl);

export const API_BASE_URL =
  CUSTOM_BACKEND_URL && !CUSTOM_BACKEND_URL.includes("garage-admin-panel-backend.onrender.com")
    ? CUSTOM_BACKEND_URL
    : import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://bhavani-motors-backend.vercel.app";