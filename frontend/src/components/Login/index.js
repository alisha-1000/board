import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./index.module.css";
import boardContext from "../../store/board-context";
import { API_HOST } from "../../utils/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /* ---------- 127.0.0.1 REDIRECT FIX ---------- */
  useEffect(() => {
    if (window.location.hostname === "127.0.0.1") {
      // 🔄 Auto-redirect to localhost to fix Google Auth 403 error
      const newUrl = window.location.href.replace("127.0.0.1", "localhost");
      window.location.href = newUrl;
    }
  }, []);

  const navigate = useNavigate();
  const { setUserLoginStatus } = useContext(boardContext);

  /* ---------- EMAIL LOGIN ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(
        `${API_HOST}/api/users/login`,
        { email, password }
      );

      const token = res.data.token;

      // ✅ FIX: correct token key
      localStorage.setItem("token", token);

      setUserLoginStatus(true);

      // ✅ navigate instead of full reload
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  /* ---------- GOOGLE LOGIN ---------- */
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await fetch(
        `${API_HOST}/api/users/google`,
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

      // ✅ FIX: correct token key
      localStorage.setItem("token", data.token);

      setUserLoginStatus(true);

      navigate("/", { replace: true });
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
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

export default Login;
