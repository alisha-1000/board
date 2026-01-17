const express = require("express");
const {
  registerUser,
  loginUser,
  getUser,
} = require("../controllers/userController");

const { googleAuth } = require("../controllers/googleAuthController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/* ---------- AUTH ROUTES ---------- */
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);

/* ---------- PROTECTED ROUTE ---------- */
router.get("/me", authMiddleware, getUser);

module.exports = router;
