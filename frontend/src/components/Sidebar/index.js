import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import "./index.min.css";
import { useNavigate, useParams } from "react-router-dom";
import boardContext from "../../store/board-context";
import { API_HOST } from "../../utils/api";
// import { getSocket } from "../../utils/socket"; // REMOVED

const Sidebar = () => {
  const [canvases, setCanvases] = useState([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [joinLink, setJoinLink] = useState(""); // 🔗 For joining existing boards

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
    currentUser,
    setCurrentUser,
    socket,
  } = useContext(boardContext);

  /* ---------------- FETCH USER INFO ---------------- */
  useEffect(() => {
    const fetchUser = async () => {
      if (!token || currentUser) return;
      try {
        const res = await axios.get(`${API_HOST}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, [token, currentUser, setCurrentUser]);



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

  useEffect(() => {
    if (!token || !currentUser || !socket) return;

    // const socket = getSocket(); // REMOVED

    const handleCanvasShared = ({ userId }) => {
      if (String(userId) === String(currentUser._id)) {
        console.log("🔔 New canvas shared! Refreshing...");
        setSuccess("A new canvas has been shared with you!");
        setTimeout(() => setSuccess(""), 5000);
        fetchCanvases();
      }
    };

    socket.on("canvasShared", handleCanvasShared);
    return () => socket.off("canvasShared", handleCanvasShared);
  }, [token, currentUser, fetchCanvases, socket]);

  /* ---------------- COPY LINK ---------------- */
  const handleCopyLink = (cid) => {
    const link = `${window.location.origin}/${cid}`;
    navigator.clipboard.writeText(link);
    setSuccess("Link copied to clipboard!");
    setTimeout(() => setSuccess(""), 3000);
  };

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

  /* ---------------- LEAVE CANVAS ---------------- */
  const handleLeaveCanvas = async (leaveId) => {
    if (!token) return;
    try {
      await axios.put(
        `${API_HOST}/api/canvas/leave/${leaveId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (leaveId === canvasId) {
        setCanvasId("");
        navigate("/");
      }

      fetchCanvases();
    } catch (err) {
      console.error("Leave canvas error:", err.response?.data);
      setError("Failed to leave canvas");
    }
  };

  /* ---------------- SHARE CANVAS ---------------- */
  const handleShare = async () => {
    if (!email.trim()) {
      setError("Please enter an email");
      return;
    }
    // 🔥 Use id from params (more reliable in Sidebar)
    if (!id || !token) return;

    try {
      setError("");
      setSuccess("");

      const response = await axios.put(
        `${API_HOST}/api/canvas/share/${id}`,
        { email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message || "Canvas shared successfully");
      setEmail("");

      // 🔄 Refresh the list immediately to show the new shared user
      fetchCanvases();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Share error:", err.response?.data);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to share canvas");
      setTimeout(() => setError(""), 5000);
    }
  };

  /* ---------------- JOIN VIA LINK/ID ---------------- */
  const handleJoinByLink = useCallback(() => {
    if (!joinLink.trim()) return;

    let targetId = joinLink.trim();

    // 🔗 Extract ID if it's a full URL
    if (targetId.includes("/")) {
      const parts = targetId.split("/");
      targetId = parts[parts.length - 1];
    }

    // 🔍 Validate ID shape (MongoDB-like 24 chars)
    if (targetId.length !== 24) {
      setError("Invalid Canvas ID or Link");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setCanvasId(targetId);
    navigate(`/${targetId}`);
    setJoinLink("");
    setSuccess("Joining canvas...");
    setTimeout(() => setSuccess(""), 3000);
  }, [joinLink, navigate, setCanvasId]);

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

      {/* 🔗 JOIN EXISTING CANVAS */}
      <div className="join-container">
        <input
          type="text"
          placeholder="Paste Board Link or ID"
          value={joinLink}
          onChange={(e) => setJoinLink(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoinByLink()}
        />
        <button onClick={handleJoinByLink} className="join-btn">Join</button>
      </div>

      {/* 👤 MANAGE SHARING (OWNER OR COLLABORATOR) - RELOCATED UNDER CREATE BUTTON */}
      {(() => {
        if (!currentUser || !id) return null;
        const currentCanvas = canvases.find(c => c._id === id);
        if (!currentCanvas) return null;

        const isOwner = String(currentCanvas.owner) === String(currentUser._id);
        const isShared = currentCanvas.shared?.some(u => String(typeof u === 'string' ? u : u._id) === String(currentUser._id));

        if (!isOwner && !isShared) return null;

        return (
          <div className="share-management">
            <button
              className="copy-link-main"
              onClick={() => handleCopyLink(id)}
            >
              Copy Invite Link
            </button>

            <div className="share-input-row">
              <input
                type="email"
                placeholder="Collaborator email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={handleShare} className="share-btn">Add</button>
            </div>

            <div className="individual-sharing">
              {(() => {
                const canvas = currentCanvas;
                if (!canvas.shared || canvas.shared.length === 0) return null;

                return (
                  <ul className="shared-user-list">
                    {canvas.shared.map((user) => (
                      <li key={typeof user === 'string' ? user : user._id}>
                        <span>{typeof user === 'string' ? user : user.email}</span>
                        <button
                          className="unshare-btn"
                          title="Remove access"
                          onClick={async () => {
                            const userIdToRemove = typeof user === 'string' ? user : user._id;
                            try {
                              const res = await axios.put(
                                `${API_HOST}/api/canvas/unshare/${id}`,
                                { userIdToRemove },
                                { headers: { Authorization: `Bearer ${token}` } }
                              );
                              setSuccess(res.data.message);
                              fetchCanvases();
                              setTimeout(() => setSuccess(""), 3000);
                            } catch (err) {
                              setError("Failed to remove user");
                            }
                          }}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        );
      })()}

      <ul className="canvas-list">
        {canvases.map((canvas) => (
          <li
            key={canvas._id}
            className={`canvas-item ${canvas._id === canvasId ? "selected" : ""}`}
          >
            <span
              className="canvas-name"
              onClick={() => navigate(`/${canvas._id}`)}
            >
              ID: {canvas._id.slice(-6)}
            </span>
            <div className="canvas-actions">
              {(() => {
                if (!currentUser) return null;
                const isOwner = String(canvas.owner) === String(currentUser._id);

                if (isOwner) {
                  return (
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteCanvas(canvas._id)}
                      title="Delete canvas"
                    >
                      del
                    </button>
                  );
                } else {
                  return (
                    <button
                      className="leave-button"
                      onClick={() => handleLeaveCanvas(canvas._id)}
                      title="Leave canvas"
                      style={{ background: "#ff9800", fontSize: "10px", padding: "2px 4px", borderRadius: "4px", color: "white", border: "none" }}
                    >
                      leave
                    </button>
                  );
                }
              })()}
            </div>
          </li>
        ))}
      </ul>

      {/* REMOVED OLD SHARING PLACEMENT */}

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div className="auth-container">
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
    </div>
  );
};

export default Sidebar;
