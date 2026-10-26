import { io } from "socket.io-client";

const CUSTOM_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const isDev = import.meta.env.MODE === "development";

const BACKEND_URL =
  CUSTOM_BACKEND_URL && !CUSTOM_BACKEND_URL.includes("garage-admin-panel-backend.onrender.com")
    ? CUSTOM_BACKEND_URL
    : isDev
    ? "http://localhost:5000"
    : "https://bhavani-motors-backend.vercel.app";

const socket = BACKEND_URL
  ? io(BACKEND_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 3,
      reconnectionDelay: 5000,
      timeout: 8000,
      autoConnect: true,
    })
  : {
      on: () => {},
      off: () => {},
      emit: () => {},
    };

if (socket && typeof socket.on === "function") {
  socket.on("connect_error", () => {});
}

export default socket;