import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

  return (
    <div className="login-container">
      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
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

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Login;
