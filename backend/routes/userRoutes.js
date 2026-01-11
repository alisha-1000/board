const express = require("express");
const {
  registerUser,
  loginUser,
  getUser,
} = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// get current logged-in user
router.get("/me", authMiddleware, getUser);

module.exports = router;
