const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

/* ---------- JWT SECRET (fallback) ---------- */
// Allow a sensible default so the server doesn't crash in dev without env vars
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

/* ---------- REGISTER USER (AUTO LOGIN) ---------- */
const registerUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Please login.",
      });
    }



    console.time("UserCreate");
    const user = await User.create({
      email,
      password,
      provider: "local",
    });
    console.timeEnd("UserCreate");

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("Register user error:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ---------- LOGIN USER ---------- */
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // 🟢 Specific error for Google users trying password login
    if (!user.password || user.provider === "google") {
      return res.status(400).json({
        message: "Account created with Google. Please use Google Login.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error("Login user error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ---------- GET CURRENT USER ---------- */
const getUser = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
};
