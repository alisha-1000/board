import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { FiMail, FiLock, FiCheck, FiShield, FiUsers, FiCpu } from "react-icons/fi";
import styles from "./index.module.css";
import boardContext from "../../store/board-context";
import { API_HOST } from "../../utils/api";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: "", color: "" });

  /* ---------- 127.0.0.1 REDIRECT FIX ---------- */
  useEffect(() => {
    if (window.location.hostname === "127.0.0.1") {
      const newUrl = window.location.href.replace("127.0.0.1", "localhost");
      window.location.href = newUrl;
    }
  }, []);

  const navigate = useNavigate();
  const { setUserLoginStatus } = useContext(boardContext);

  /* ---------- PASSWORD STRENGTH CHECKER ---------- */
  const checkPasswordStrength = (pass) => {
    if (!pass) return { level: 0, text: "", color: "" };

    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    const levels = [
      { level: 0, text: "Too short", color: "#e5e7eb" }, // gray
      { level: 1, text: "Weak", color: "#ef4444" }, // red
      { level: 2, text: "Fair", color: "#f59e0b" }, // yellow
      { level: 3, text: "Good", color: "#22c55e" }, // green
      { level: 4, text: "Strong", color: "#10b981" }, // emerald
      { level: 5, text: "Excellent", color: "#06b6d4" }, // cyan
    ];

    return levels[score];
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  /* ---------- EMAIL / PASSWORD REGISTER ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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
      <video autoPlay loop muted playsInline className={styles.videoBackground}>
        <source src="https://videos.pexels.com/video-files/3753517/3753517-hd_1920_1080_25fps.mp4" type="video/mp4" />
      </video>
      <div className={styles.overlay}></div>
      <div className={styles.registerWrapper}>
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <div className={styles.brandIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className={styles.welcomeTitle}>Join Whiteboard</h1>
          <p className={styles.welcomeDescription}>
            Start visualizing your ideas today. Create an account to save your boards and collaborate with others.
          </p>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><FiCpu /></span>
              <span>Unlimited Boards</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><FiShield /></span>
              <span>Cloud Storage</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}><FiUsers /></span>
              <span>Team Sharing</span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className={styles.formSection}>
          <h2 className={styles.formTitle}>Create Account</h2>
          <p className={styles.formSubtitle}>Fill in your details to get started</p>

          <form onSubmit={handleSubmit} className={styles.registerForm}>
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
                placeholder="Create password"
                value={password}
                onChange={handlePasswordChange}
                required
              />
              <span className={styles.inputIcon}>
                <FiLock />
              </span>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className={styles.passwordStrength}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${(passwordStrength.level / 5) * 100}%`,
                      background: passwordStrength.color,
                    }}
                  />
                </div>
                <span className={styles.strengthText} style={{ color: passwordStrength.color }}>
                  {passwordStrength.text}
                </span>
              </div>
            )}

            <div className={styles.inputGroup}>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <span className={styles.inputIcon}>
                <FiCheck />
              </span>
            </div>

            <button type="submit" className={styles.submitButton}>
              Create Account
            </button>
          </form>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <div className={styles.googleLogin}>
            <GoogleLogin
              onSuccess={handleGoogleRegister}
              onError={() => setError("Google signup failed")}
            />
          </div>

          <p className={styles.loginLink}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>

          <p className={styles.terms}>
            By creating an account, you agree to our <a href="/" onClick={(e) => e.preventDefault()}>Terms of Service</a> and <a href="/" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
