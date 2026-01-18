const mongoose = require("mongoose");

const canvasSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shared: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    elements: [{ type: mongoose.Schema.Types.Mixed }],
    comments: [{
        text: String,
        x: Number,
        y: Number,
        author: { type: String }, // Storing email or name for now
        createdAt: { type: Date, default: Date.now }
    }],
    messages: [{
        text: String,
        author: String,
        email: String,
        isOwner: { type: Boolean, default: false },
        clientMsgId: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Canvas", canvasSchema);
