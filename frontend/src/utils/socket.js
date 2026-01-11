import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("whiteboard_user_token");

  // 🔥 Prevent duplicate connections
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io("https://whiteboard-1-2e0z.onrender.com/", {
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
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
