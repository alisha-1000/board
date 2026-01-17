const express = require("express");
const {
  registerUser,
  loginUser,
  getUser,
} = require("../controllers/userController");
const { googleAuth } = require("../controllers/googleAuthController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.get("/me", authMiddleware, getUser);

module.exports = router;
