const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    // ❗ Password is optional now (OAuth users won't have it)
    password: {
      type: String,
      required: false,
    },

    // 🔐 Auth provider
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // 🟢 Google specific ID
    googleId: {
      type: String,
    },
  },
  { timestamps: true }
);

/* ---------- HASH PASSWORD ---------- */
userSchema.pre("save", async function (next) {
  // If no password (OAuth user) OR not modified → skip
  if (!this.password || !this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/* ---------- COMPARE PASSWORD ---------- */
userSchema.methods.comparePassword = async function (enteredPassword) {
  // OAuth users don't have passwords
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
