import { io } from "socket.io-client";

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
const isDev = import.meta.env.MODE === "development";

const BACKEND_URL =
  CUSTOM_BACKEND_URL && !CUSTOM_BACKEND_URL.includes("garage-admin-panel-backend.onrender.com")
    ? CUSTOM_BACKEND_URL
    : isDev
    ? "http://localhost:5000"
    : "https://bhavani-motors-backend.vercel.app";

const isVercel = Boolean(BACKEND_URL && BACKEND_URL.includes(".vercel.app"));

const socket = BACKEND_URL && !isVercel
  ? io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 2,
      reconnectionDelay: 5000,
      timeout: 5000,
      autoConnect: true,
    })
  : {
      on: () => {},
      off: () => {},
      emit: () => {},
      connected: false,
    };

if (socket && typeof socket.on === "function") {
  socket.on("connect_error", () => {});
}

export default socket;