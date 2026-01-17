import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import "./index.min.css";
import { useNavigate, useParams } from "react-router-dom";
import boardContext from "../../store/board-context";
import { API_HOST } from "../../utils/api";

const Sidebar = () => {
  const [canvases, setCanvases] = useState([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ✅ TOKEN AS STATE (IMPORTANT)
  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    canvasId,
    setCanvasId,
    isUserLoggedIn,
    setUserLoginStatus,
  } = useContext(boardContext);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (!token) {
      setUserLoginStatus(false);
      setCanvases([]);
      setCanvasId("");
      navigate("/login");
    }
  }, [token, navigate, setUserLoginStatus, setCanvasId]);

  /* ---------------- CREATE CANVAS ---------------- */
  const handleCreateCanvas = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_HOST}/api/canvas/create`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const newCanvasId = response.data.canvasId;
      setCanvasId(newCanvasId);
      navigate(`/${newCanvasId}`);
    } catch (err) {
      console.error("Create canvas error:", err.response?.data);
      setError("Failed to create canvas");
    }
  }, [token, navigate, setCanvasId]);

  /* ---------------- FETCH CANVASES ---------------- */
  const fetchCanvases = useCallback(async () => {
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_HOST}/api/canvas/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const list = response.data || [];
      setCanvases(list);

      if (!canvasId && !id && list.length > 0) {
        setCanvasId(list[0]._id);
        navigate(`/${list[0]._id}`);
      }
    } catch (err) {
      console.error("Fetch canvases error:", err.response?.data);
      setError("Failed to load canvases");
    }
  }, [token, canvasId, id, navigate, setCanvasId]);

  /* ---------------- INITIAL LOAD ---------------- */
  useEffect(() => {
    if (!isUserLoggedIn || !token) return;
    fetchCanvases();
  }, [isUserLoggedIn, token, fetchCanvases]);

  /* ---------------- DELETE CANVAS ---------------- */
  const handleDeleteCanvas = async (deleteId) => {
    if (!token) return;

    try {
      await axios.delete(
        `${API_HOST}/api/canvas/delete/${deleteId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (deleteId === canvasId) {
        setCanvasId("");
        navigate("/");
      }

      fetchCanvases();
    } catch (err) {
      console.error("Delete canvas error:", err.response?.data);
      setError("Failed to delete canvas");
    }
  };

  /* ---------------- SHARE CANVAS ---------------- */
  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email");
      return;
    }
    if (!canvasId || !token) return;

    try {
      setError("");
      setSuccess("");

      const response = await axios.put(
        `https://board-1-lrt8.onrender.com/api/canvas/share/${canvasId}`,
        { email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message || "Canvas shared successfully");
      setEmail("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Share error:", err.response?.data);
      setError(err.response?.data?.message || "Failed to share canvas");
      setTimeout(() => setError(""), 3000);
    }
  };

  /* ---------------- AUTH ---------------- */
  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserLoginStatus(false);
    setCanvases([]);
    setCanvasId("");
    navigate("/login");
  };

  const handleLogin = () => navigate("/login");

  /* ---------------- UI ---------------- */
  return (
    <div className="sidebar">
      <button
        className="create-button"
        onClick={handleCreateCanvas}
        disabled={!isUserLoggedIn || !token}
      >
        + Create New Canvas
      </button>

      <ul className="canvas-list">
        {canvases.map((canvas) => (
          <li
            key={canvas._id}
            className={`canvas-item ${canvas._id === canvasId ? "selected" : ""
              }`}
          >
            <span
              className="canvas-name"
              onClick={() => navigate(`/${canvas._id}`)}
            >
              {canvas._id.slice(-6)}
            </span>
            <button
              className="delete-button"
              onClick={() => handleDeleteCanvas(canvas._id)}
            >
              del
            </button>
          </li>
        ))}
      </ul>

      <div className="share-container">
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleShare} disabled={!isUserLoggedIn || !canvasId}>
          Share
        </button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>

      {isUserLoggedIn ? (
        <button className="auth-button logout-button" onClick={handleLogout}>
          Logout
        </button>
      ) : (
        <button className="auth-button login-button" onClick={handleLogin}>
          Login
        </button>
      )}
    </div>
  );
};

export default Sidebar;
