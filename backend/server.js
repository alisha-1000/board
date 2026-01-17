const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectToDB = require("./config/db");
const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");

const Canvas = require("./models/canvasModel");
const userRoutes = require("./routes/userRoutes");
const canvasRoutes = require("./routes/canvasRoutes");

const app = express();

/* ---------------- CONFIG ---------------- */
const PORT = process.env.PORT || 5001;
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

/* ---------------- MIDDLEWARE ---------------- */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://whiteboard-tutorial-eight.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());

/* ---------------- ROUTES ---------------- */
app.use("/api/users", userRoutes);
app.use("/api/canvas", canvasRoutes);

app.get("/", (req, res) => {
  res.send("Board backend running 🚀");
});

/* ---------------- DB ---------------- */
connectToDB();

/* ---------------- SOCKET ---------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://whiteboard-tutorial-eight.vercel.app",
    ],
    methods: ["GET", "POST"],
  },
});

/* ---------------- IN-MEMORY CANVAS CACHE REMOVED ---------------- */
// const canvasData = {}; // ❌ Removed to prevent memory leak


io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  /* -------- JOIN CANVAS -------- */
  socket.on("joinCanvas", async ({ canvasId }) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        socket.emit("unauthorized", { message: "Access Denied: No Token" });
        return;
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, SECRET_KEY);
      const userId = decoded.userId;

      const canvas = await Canvas.findById(canvasId);
      if (
        !canvas ||
        (String(canvas.owner) !== String(userId) &&
          !canvas.shared.includes(userId))
      ) {
        socket.emit("unauthorized", {
          message: "You are not authorized to join this canvas.",
        });
        return;
      }

      socket.join(canvasId);

      const elementsToSend = canvas.elements || [];

      socket.emit("loadCanvas", elementsToSend);

      console.log(`✅ User ${socket.id} joined canvas ${canvasId}`);
    } catch (error) {
      console.error("❌ Socket auth error:", error.message);
      socket.emit("unauthorized", { message: "Invalid token" });
    }
  });

  /* -------- DRAW UPDATE -------- */
  socket.on("drawingUpdate", async ({ canvasId, elements }) => {
    try {
      // canvasData[canvasId] = elements; // ❌ Removed


      socket.to(canvasId).emit("receiveDrawingUpdate", elements);

      await Canvas.findByIdAndUpdate(canvasId, { elements });
    } catch (error) {
      console.error("❌ Drawing update error:", error);
    }
  });

  /* -------- DISCONNECT -------- */
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

/* ---------------- START SERVER ---------------- */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
