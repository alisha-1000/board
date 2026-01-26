import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { FiMail, FiLock, FiStar, FiMessageSquare, FiPenTool } from "react-icons/fi";
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
      // Auto-redirect to localhost to fix Google Auth 403 error
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

      //  FIX: correct token key
      localStorage.setItem("token", token);

      setUserLoginStatus(true);

      //  navigate instead of full reload
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  /* ---------- GOOGLE LOGIN ---------- */
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const response = await axios.post(`${API_HOST}/api/users/google`, {
        token: credentialResponse.credential,
      });

      const { token: jwtToken } = response.data;
      localStorage.setItem("token", jwtToken);
      setUserLoginStatus(true);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.response?.data?.message || "Google login failed");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <video autoPlay loop muted playsInline crossOrigin="anonymous" className={styles.videoBackground}>
        <source src="https://videos.pexels.com/video-files/3247854/3247854-hd_1920_1080_25fps.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay}></div>
      <div className={styles.loginWrapper}>
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <div className={styles.brandIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className={styles.welcomeTitle}>Welcome to Whiteboard</h1>
          <p className={styles.welcomeDescription}>
            Collaborate in real-time with your team. Draw, sketch, and brainstorm together on an infinite canvas.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><FiStar /></span>
              <span>Real-time collaboration</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><FiMessageSquare /></span>
              <span>Live chat & comments</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><FiPenTool /></span>
              <span>Powerful drawing tools</span>
            </div>
          </div>
        </div>

        {/* Login Form Section */}
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>Sign In</h2>
          <p className={styles.formSubtitle}>Welcome back!</p>

          {/* Email Login */}
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <span className={styles.inputIcon}>
                <FiMail />
              </span>
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className={styles.inputIcon}>
                <FiLock />
              </span>
            </div>

            <button type="submit" className={styles.submitButton}>Sign In</button>
          </form>

          {error && <p className={styles.error}>{error}</p>}

          {/* Divider */}
          <div className={styles.divider}>
            <span>OR</span>
          </div>

          {/* Google Login */}
          <div className={styles.googleLogin}>
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => setError("Google login failed")}
            />
          </div>

          {/* Register Link */}
          <p className={styles.registerLink}>
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
