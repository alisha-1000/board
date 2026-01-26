const Canvas = require("../models/canvasModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");

// Create a new canvas
exports.createCanvas = async (req, res) => {
    try {
        const userId = req.user.userId; // Get the authenticated user ID

        const newCanvas = new Canvas({
            owner: userId,
            shared: [],
            elements: []
        });

        await newCanvas.save();
        res.status(201).json({ message: "Canvas created successfully", canvasId: newCanvas._id });
    } catch (error) {
        res.status(500).json({ error: "Failed to create canvas", details: error.message });
    }
};

// Update an existing canvas (when elements are drawn)
exports.updateCanvas = async (req, res) => {
    try {
        const { canvasId, elements } = req.body;
        const userId = req.user.userId;
        console.log("canvas id ", canvasId)

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }

        // Ensure only the owner or shared users can update
        const isOwner = canvas.owner.toString() === userId;
        const isShared = canvas.shared.some(id => id.toString() === userId);

        if (!isOwner && !isShared) {
            return res.status(403).json({ error: "Unauthorized to update this canvas" });
        }

        canvas.elements = elements;
        await canvas.save();

        console.log("saved")

        res.json({ message: "Canvas updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update canvas", details: error.message });
    }
};

// Load a canvas
exports.loadCanvas = async (req, res) => {
    try {
        const canvasId = req.params.id;
        const userId = req.user.userId;

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }

        // Ensure only the owner or shared users can access it
        const isOwner = canvas.owner.toString() === userId;
        const isShared = canvas.shared.some(id => id.toString() === userId);

        if (!isOwner && !isShared) {
            return res.status(403).json({ error: "Unauthorized to access this canvas" });
        }

        res.json(canvas);
    } catch (error) {
        res.status(500).json({ error: "Failed to load canvas", details: error.message });
    }
};


exports.shareCanvas = async (req, res) => {
    try {
        const { email } = req.body;
        const canvasId = req.params.id;
        const userId = req.user.userId;

        // Find the user by email
        const userToShare = await User.findOne({ email });
        if (!userToShare) {
            return res.status(404).json({ error: "User with this email not found" });
        }

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }

        const isOwner = canvas.owner.toString() === userId;
        const isShared = canvas.shared.some(id => id.toString() === userId);

        if (!isOwner && !isShared) {
            return res.status(403).json({ error: "Only authorized users can share this canvas" });
        }

        if (canvas.owner.toString() === userToShare._id.toString()) {
            return res.status(400).json({ error: "You are the owner of this canvas" });
        }

        if (canvas.shared.some(id => id.toString() === userToShare._id.toString())) {
            return res.status(400).json({ error: "Already shared with this user" });
        }

        // Real-time Notification for Invitation
        const io = req.app.get("socketio");
        const globalUsers = req.app.get("globalUsers");

        if (io && globalUsers && globalUsers[userToShare._id.toString()]) {
            const inviterEmail = req.user.email || "Someone";
            globalUsers[userToShare._id.toString()].forEach(sid => {
                io.to(sid).emit("inviteRequest", {
                    canvasId,
                    inviterId: userId,
                    inviterEmail,
                });
            });
            res.json({ message: `Invitation sent to ${email}. Waiting for response...` });
        } else {
            res.status(400).json({ error: "User is currently offline and cannot accept invitations." });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to send invitation", details: error.message });
    }
};


// Leave a shared canvas
exports.leaveCanvas = async (req, res) => {
    try {
        const canvasId = req.params.id;
        const userId = req.user.userId;

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }

        // Remove the user from the shared list
        canvas.shared = canvas.shared.filter(id => id.toString() !== userId);
        await canvas.save();

        res.json({ message: "You have left the canvas" });
    } catch (error) {
        res.status(500).json({ error: "Failed to leave canvas", details: error.message });
    }
};

// Unshare canvas from a user
exports.unshareCanvas = async (req, res) => {
    try {
        const { userIdToRemove } = req.body;
        const canvasId = req.params.id;
        const userId = req.user.userId;

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }

        const isOwner = canvas.owner.toString() === userId;
        const isShared = canvas.shared.some(id => id.toString() === userId);

        if (!isOwner && !isShared) {
            return res.status(403).json({ error: "Only authorized users can unshare this canvas" });
        }

        canvas.shared = canvas.shared.filter(id => id.toString() !== userIdToRemove);
        await canvas.save();

        const updatedCanvas = await Canvas.findById(canvasId).populate("shared", "email");
        const sharedEmails = updatedCanvas.shared.map(u => u.email);

        // Notify client
        const io = req.app.get("socketio");
        if (io) {
            io.to(canvasId).emit("sharingUpdate", { sharedEmails });
        }

        res.json({ message: "Canvas unshared successfully", sharedEmails });
    } catch (error) {
        res.status(500).json({ error: "Failed to unshare canvas", details: error.message });
    }
};

exports.deleteCanvas = async (req, res) => {
    try {
        const canvasId = req.params.id;
        const userId = req.user.userId;

        const canvas = await Canvas.findById(canvasId);
        if (!canvas) {
            return res.status(404).json({ error: "Canvas not found" });
        }

        if (canvas.owner.toString() !== userId) {
            return res.status(403).json({ error: "Only the owner can delete this canvas" });
        }

        await Canvas.findByIdAndDelete(canvasId);
        res.json({ message: "Canvas deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete canvas", details: error.message });
    }
};

exports.getUserCanvases = async (req, res) => {
    try {
        const userId = req.user.userId;

        const canvases = await Canvas.find({
            $or: [{ owner: userId }, { shared: userId }]
        })
            .populate("shared", "email") // 🔥 CRITICAL for sidebar list
            .sort({ createdAt: -1 });

        res.json(canvases);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch canvases", details: error.message });
    }
};