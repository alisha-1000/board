const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

/* ---------- GOOGLE OAUTH ---------- */
const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        googleId,
        provider: "google",
      });
    }

    const jwtToken = jwt.sign(
      { userId: user._id },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.json({ token: jwtToken });
  } catch (error) {
    res.status(401).json({ message: "Google authentication failed" });
  }
};

module.exports = {
  googleAuth,
};
