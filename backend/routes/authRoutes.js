const express = require("express");
const {
  registerUser,
  loginUser,
  getUser,
} = require("../controllers/authController");

const { googleAuth } = require("../controllers/googleAuthController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth); // 🔥 OAuth route
router.get("/me", authMiddleware, getUser);

module.exports = router;
