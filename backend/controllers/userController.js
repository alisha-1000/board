const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

/* ---------- REGISTER (AUTO LOGIN) ---------- */
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Please login.",
      });
    }

    const user = await User.create({
      email,
      password,
      provider: "local",
    });

    const token = jwt.sign(
      { userId: user._id },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      message: "User registered successfully",
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ---------- LOGIN (EMAIL + PASSWORD ONLY) ---------- */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // user nahi mila ya password hi nahi hai
    if (!user || !user.password) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};

/* ---------- GET USER ---------- */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
};
