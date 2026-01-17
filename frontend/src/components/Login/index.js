import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./index.module.css";
import boardContext from "../../store/board-context";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUserLoginStatus } = useContext(boardContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        "https://board-1-lrt8.onrender.com/api/users/login",
        { email, password }
      );

      const token = res.data.token;
      console.log(token);

      // 🔥 THESE 3 LINES ARE CRITICAL
      localStorage.setItem("whiteboard_user_token", token);

      setUserLoginStatus(true);

      // 🔥 FORCE SIDEBAR TO RE-READ TOKEN
      window.location.href = "/"; 
      // (simple + safe way)

    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  /* ---------- GOOGLE LOGIN ---------- */
  const handleGoogleLogin = async (credentialResponse) => {
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
        setError(data.message || "Google login failed");
        return;
      }

      // ✅ SAVE TOKEN
      localStorage.setItem("whiteboard_user_token", data.token);
      setUserLoginStatus(true);

      // 🔥 FORCE FULL RELOAD
      window.location.href = "/";
    } catch (err) {
      console.error("Google login error:", err);
      setError("Google login failed");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h2>Login</h2>

      {/* -------- EMAIL LOGIN -------- */}
      <form onSubmit={handleSubmit} className={styles.loginForm}>
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

        <button type="submit">Login</button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {/* -------- OR -------- */}
      <div style={{ margin: "16px 0", textAlign: "center" }}>OR</div>

      {/* -------- GOOGLE LOGIN -------- */}
      <GoogleLogin
        onSuccess={handleGoogleLogin}
        onError={() => setError("Google login failed")}
      />

      <p style={{ marginTop: "16px" }}>
        Don't have an account?{" "}
        <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login;
