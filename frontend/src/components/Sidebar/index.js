import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import "./index.min.css";
import { useNavigate, useParams } from "react-router-dom";
import boardContext from "../../store/board-context";

const Sidebar = () => {
  const [canvases, setCanvases] = useState([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("whiteboard_user_token");
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    canvasId,
    setCanvasId,
    isUserLoggedIn,
    setUserLoginStatus,
  } = useContext(boardContext);

  /* ---------------- CREATE CANVAS ---------------- */
  const handleCreateCanvas = useCallback(async () => {
    try {
      const response = await axios.post(
        "https://whiteboard-1-2e0z.onrender.com/api/canvas/create",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCanvasId(response.data.canvasId);
      navigate(`/${response.data.canvasId}`);
    } catch (error) {
      console.error("Error creating canvas:", error);
    }
  }, [token, navigate, setCanvasId]);

  /* ---------------- FETCH CANVASES ---------------- */
  const fetchCanvases = useCallback(async () => {
    try {
      const response = await axios.get(
        "https://whiteboard-1-2e0z.onrender.com/api/canvas/list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCanvases(response.data);

      if (response.data.length === 0) {
        await handleCreateCanvas();
      } else if (!canvasId && !id) {
        setCanvasId(response.data[0]._id);
        navigate(`/${response.data[0]._id}`);
      }
    } catch (err) {
      console.error("Error fetching canvases:", err);
    }
  }, [token, canvasId, id, navigate, setCanvasId, handleCreateCanvas]);

  useEffect(() => {
    if (isUserLoggedIn) {
      fetchCanvases();
    }
  }, [isUserLoggedIn, fetchCanvases]);

  /* ---------------- DELETE CANVAS ---------------- */
  const handleDeleteCanvas = async (canvasId) => {
    try {
      await axios.delete(
        `https://whiteboard-1-2e0z.onrender.com/api/canvas/delete/${canvasId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchCanvases();
    } catch (error) {
      console.error("Error deleting canvas:", error);
    }
  };

  /* ---------------- SHARE CANVAS ---------------- */
  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await axios.put(
        `https://whiteboard-1-2e0z.onrender.com/api/canvas/share/${canvasId}`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(response.data.message);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to share canvas");
      setTimeout(() => setError(""), 4000);
    }
  };

  /* ---------------- AUTH ---------------- */
  const handleLogout = () => {
    localStorage.removeItem("whiteboard_user_token");
    setUserLoginStatus(false);
    setCanvases([]);
    navigate("/login");
  };

  const handleLogin = () => navigate("/login");

  return (
    <div className="sidebar">
      <button
        className="create-button"
        onClick={handleCreateCanvas}
        disabled={!isUserLoggedIn}
      >
        + Create New Canvas
      </button>

      <ul className="canvas-list">
        {canvases.map((canvas) => (
          <li
            key={canvas._id}
            className={`canvas-item ${
              canvas._id === canvasId ? "selected" : ""
            }`}
          >
            <span
              className="canvas-name"
              onClick={() => navigate(`/${canvas._id}`)}
            >
              {canvas._id}
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
        <button onClick={handleShare} disabled={!isUserLoggedIn}>
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
