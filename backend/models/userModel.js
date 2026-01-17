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
  // OAuth user OR password unchanged → skip
  if (!this.password || !this.isModified("password")) return next();

  try {
    // bcrypt automatically generates salt
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

/* ---------- COMPARE PASSWORD ---------- */
userSchema.methods.comparePassword = async function (enteredPassword) {
  // OAuth users don't have passwords
  if (!this.password) return false;

  // compare plain password with stored hash
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
