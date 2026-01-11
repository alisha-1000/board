const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET;

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access Denied: No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    // ✅ IMPORTANT: keep structure consistent
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};
