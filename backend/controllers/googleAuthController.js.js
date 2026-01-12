const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ email });

    // 🟢 FIRST TIME GOOGLE USER
    if (!user) {
      user = await User.create({
        email,
        googleId,
        provider: "google",
      });
    } 
    // 🟢 USER EXISTS (local or google) → just link googleId
    else {
      user.googleId = googleId;
      await user.save();
    }

    // 🔐 Auto login
    const jwtToken = jwt.sign(
      { userId: user._id },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.json({ token: jwtToken });

  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

module.exports = { googleAuth };
