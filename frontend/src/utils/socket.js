import { io } from "socket.io-client";
import { API_HOST } from "./api";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  // If socket already exists and is connected, don't reconnect unless token missing
  if (socket && socket.connected) {
    return socket;
  }

  // If socket exists but disconnected, or brand new
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  console.log("🔌 Initializing new socket connection...");
  socket = io(API_HOST, {
    auth: {
      token: token ? `Bearer ${token}` : null,
    },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => console.log("Socket connected:", socket.id));
  socket.on("disconnect", (reason) => console.warn("Socket disconnected:", reason));
  socket.on("connect_error", (error) => console.error("Socket connection error:", error));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
