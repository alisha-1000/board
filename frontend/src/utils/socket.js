import { io } from "socket.io-client";
import { API_HOST } from "./api";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  // 🔥 Prevent duplicate connections
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(API_HOST, {
    auth: {
      token: token ? `Bearer ${token}` : null,
    },
    transports: ["websocket"],
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
