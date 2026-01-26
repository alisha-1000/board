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
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
      ];

      // Allow all Vercel deployments
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

/* ---------------- ROUTES ---------------- */
app.use("/api/users", userRoutes);
app.use("/api/canvas", canvasRoutes);

app.get("/", (req, res) => {
  res.send("Board backend running");
});

/* ---------------- DB ---------------- */
connectToDB();

/* Socket.io Configuration */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
      ];

      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
  },
});

const roomUsers = {}; // Presence tracking by canvasId
const globalUsers = {}; // Presence tracking by userId: { userId: Set of socketIds }

app.set("socketio", io);
app.set("globalUsers", globalUsers);

const getUniqueUsers = (canvasId) => {
  const uniqueUsers = [];
  const seenIds = new Set();
  if (!roomUsers[canvasId]) return [];

  Object.values(roomUsers[canvasId]).forEach(u => {
    if (!seenIds.has(String(u.userId))) {
      seenIds.add(String(u.userId));
      uniqueUsers.push(u);
    }
  });
  return uniqueUsers;
};


io.on("connection", (socket) => {
  // Extract userId from token for global tracking
  let currentUserId = null;
  const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, SECRET_KEY);
      currentUserId = decoded.userId;
      if (!globalUsers[currentUserId]) globalUsers[currentUserId] = new Set();
      globalUsers[currentUserId].add(socket.id);
    } catch (e) { }
  }
  /* Join Canvas Room */
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

      const canvas = await Canvas.findById(canvasId).populate("shared", "email");
      const isOwner = String(canvas?.owner) === String(userId);
      const isShared = canvas?.shared?.some(user => String(user._id) === String(userId));

      if (!canvas || (!isOwner && !isShared)) {
        socket.emit("unauthorized", {
          message: "You are not authorized to join this canvas.",
        });
        return;
      }

      socket.join(canvasId);

      if (!roomUsers[canvasId]) roomUsers[canvasId] = {};
      roomUsers[canvasId][socket.id] = {
        userId,
        email: decoded.email || "Guest",
        socketId: socket.id
      };

      const elementsToSend = canvas.elements || [];
      const commentsToSend = canvas.comments || [];
      const messagesToSend = canvas.messages || [];
      const sharedEmails = canvas.shared.map(u => u.email) || [];

      socket.emit("loadCanvas", {
        elements: elementsToSend,
        comments: commentsToSend,
        messages: messagesToSend,
        sharedEmails: sharedEmails
      });

      io.to(canvasId).emit("presenceUpdate", getUniqueUsers(canvasId));
      socket.to(canvasId).emit("notification", {
        message: `${decoded.email || "Someone"} joined the canvas`,
        type: "success"
      });
    } catch (error) {
      console.error(" Socket auth error:", error.message);
      socket.emit("unauthorized", { message: "Invalid token" });
    }
  });

  /* Drawing Synchronization */
  socket.on("drawingUpdate", ({ canvasId, elements }) => {
    socket.to(canvasId).emit("receiveDrawingUpdate", elements);
  });

  socket.on("saveCanvas", async ({ canvasId, elements }) => {
    try {
      await Canvas.findByIdAndUpdate(canvasId, { elements });
    } catch (error) {
      console.error("Save canvas error:", error);
    }
  });

  /* Comment Management */
  socket.on("addComment", async ({ canvasId, comment }) => {
    try {
      const { text, x, y, author } = comment;
      const newComment = { text, x, y, author, createdAt: new Date() };

      const canvas = await Canvas.findByIdAndUpdate(
        canvasId,
        { $push: { comments: newComment } },
        { new: true }
      );

      // The added comment will have an _id generated by Mongoose if we used subdocs,
      // but here we are pushing a plain object if schema defines it so.
      // Actually schema defined comments as array of objects, so Mongoose adds _id.
      // Let's grab the last comment from the updated canvas to get the real _id and date.
      const addedComment = canvas.comments[canvas.comments.length - 1];

      io.to(canvasId).emit("newComment", addedComment);
    } catch (error) {
      console.error(" Add comment error:", error);
    }
  });

  /* Chat Management */
  socket.on("sendMessage", async ({ canvasId, message }) => {
    try {
      const canvas = await Canvas.findById(canvasId);
      if (!canvas) return;

      const isOwner = String(canvas.owner) === String(message.userId || "");

      const newMessage = {
        text: message.text,
        author: message.author,
        email: message.email,
        isOwner: isOwner,
        clientMsgId: message.clientMsgId,
        createdAt: new Date()
      };

      const updatedCanvas = await Canvas.findByIdAndUpdate(
        canvasId,
        { $push: { messages: newMessage } },
        { new: true }
      );

      const savedMessage = updatedCanvas.messages[updatedCanvas.messages.length - 1];
      io.to(canvasId).emit("newMessage", savedMessage);
    } catch (error) {
      console.error("Send message error:", error);
    }
  });

  /* Invite Response Handling */
  socket.on("respondToInvite", async ({ canvasId, inviterId, response }) => {
    try {
      const decoded = jwt.verify(
        socket.handshake.auth?.token?.split(" ")[1] || socket.handshake.headers?.authorization?.split(" ")[1],
        SECRET_KEY
      );
      const userId = decoded.userId;

      if (response === "accepted") {
        const canvas = await Canvas.findById(canvasId);
        if (canvas) {
          if (!canvas.shared.includes(userId)) {
            canvas.shared.push(userId);
            await canvas.save();
          }

          // Notify Inviter
          if (globalUsers[inviterId]) {
            globalUsers[inviterId].forEach(sid => {
              io.to(sid).emit("notification", {
                message: `${decoded.email} accepted your invitation!`,
                type: "success"
              });
              io.to(sid).emit("canvasShared", { userId }); // Refresh sidebar
            });
          }

          // Notify Invitee (Self)
          socket.emit("notification", { message: "You have joined the canvas!", type: "success" });
          socket.emit("canvasShared", { userId }); // Refresh sidebar
        }
      } else {
        // Notify Inviter of rejection
        if (globalUsers[inviterId]) {
          globalUsers[inviterId].forEach(sid => {
            io.to(sid).emit("notification", {
              message: `${decoded.email} rejected your invitation.`,
              type: "error"
            });
          });
        }
      }
    } catch (error) {
      console.error("Invite response error:", error);
    }
  });

  /* Disconnection Handler */
  socket.on("disconnect", () => {
    // Cleanup globalUsers
    if (currentUserId && globalUsers[currentUserId]) {
      globalUsers[currentUserId].delete(socket.id);
      if (globalUsers[currentUserId].size === 0) {
        delete globalUsers[currentUserId];
      }
    }

    // Cleanup roomUsers
    for (const canvasId in roomUsers) {
      if (roomUsers[canvasId][socket.id]) {
        delete roomUsers[canvasId][socket.id];
        // Notify others in that room
        io.to(canvasId).emit("presenceUpdate", getUniqueUsers(canvasId));
        io.to(canvasId).emit("cursorRemove", { socketId: socket.id });

        if (Object.keys(roomUsers[canvasId]).length === 0) {
          delete roomUsers[canvasId];
        }
      }
    }
  });
});

/* Start Server */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
