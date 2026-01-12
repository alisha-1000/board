import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./index.module.css";
import boardContext from "../../store/board-context";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const { setUserLoginStatus } = useContext(boardContext);

  /* ---------- EMAIL / PASSWORD REGISTER ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch(
        "https://board-1-lrt8.onrender.com/api/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      // ✅ SAVE TOKEN
      localStorage.setItem("whiteboard_user_token", data.token);
      setUserLoginStatus(true);

      // 🔥 FORCE FULL RELOAD (VERY IMPORTANT)
      window.location.href = "/";
    } catch (err) {
      console.error("Registration error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  /* ---------- GOOGLE REGISTER / LOGIN ---------- */
  const handleGoogleRegister = async (credentialResponse) => {
    try {
      const res = await fetch(
        "https://board-1-lrt8.onrender.com/api/users/google",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: credentialResponse.credential,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Google signup failed");
        return;
      }

      // ✅ SAVE TOKEN
      localStorage.setItem("whiteboard_user_token", data.token);
      setUserLoginStatus(true);

      // 🔥 FORCE FULL RELOAD
      window.location.href = "/";
    } catch (err) {
      console.error("Google register error:", err);
      setError("Google signup failed");
    }
  };

  return (
    <div className={styles.registerContainer}>
      <h2>Register</h2>

      {/* -------- EMAIL REGISTER -------- */}
      <form onSubmit={handleSubmit} className={styles.registerForm}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit">Register</button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {/* -------- OR -------- */}
      <div style={{ margin: "16px 0", textAlign: "center" }}>OR</div>

      {/* -------- GOOGLE REGISTER -------- */}
      <GoogleLogin
        onSuccess={handleGoogleRegister}
        onError={() => setError("Google signup failed")}
      />

      <p style={{ marginTop: "16px" }}>
        Already have an account?{" "}
        <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register;
