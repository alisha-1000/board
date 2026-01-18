import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./index.module.css";
import boardContext from "../../store/board-context";
import { API_HOST } from "../../utils/api";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  /* ---------- 127.0.0.1 REDIRECT FIX ---------- */
  useEffect(() => {
    if (window.location.hostname === "127.0.0.1") {
      const newUrl = window.location.href.replace("127.0.0.1", "localhost");
      window.location.href = newUrl;
    }
  }, []);

  const navigate = useNavigate();
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
        `${API_HOST}/api/users/register`,
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

      // FIX: correct token key
      localStorage.setItem("token", data.token);

      setUserLoginStatus(true);

      // navigate instead of reload
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  /* ---------- GOOGLE REGISTER / LOGIN ---------- */
  const handleGoogleRegister = async (credentialResponse) => {
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
        setError(data.message || "Google signup failed");
        return;
      }

      //  FIX: correct token key
      localStorage.setItem("token", data.token);

      setUserLoginStatus(true);

      navigate("/", { replace: true });
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
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register;
