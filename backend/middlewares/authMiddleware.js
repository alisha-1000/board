const jwt = require("jsonwebtoken");

/* ---------- JWT SECRET (fallback) ---------- */
// Use a default value during development if env var is missing
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

/* ---------- AUTH MIDDLEWARE ---------- */
exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // { userId }
    next();
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
