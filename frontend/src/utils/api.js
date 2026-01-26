// utils/api.js
import axios from "axios";

// Allow overriding via env var, otherwise default to local backend for development
// Allow overriding via env var, otherwise default to local backend for development
// ⚡️ FIX: Use 127.0.0.1 instead of localhost to avoid IPv6 lookup delay on macOS
// ⚡️ FIX: Auto-detect if we should use local or production API
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
export const API_HOST = isLocal
  ? "http://127.0.0.1:5001"
  : (process.env.REACT_APP_API_BASE_URL?.replace(/\/+$/, "") || "http://127.0.0.1:5001");

const API_BASE_URL = `${API_HOST}/api/canvas`;

/* ---------------- HELPERS ---------------- */

const getAuthHeaders = () => {
  const token = localStorage.getItem("token"); // CORRECT
  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

/* ---------------- API CALLS ---------------- */

export const updateCanvas = async (canvasId, elements) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/update`,
      { canvasId, elements },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error(" Error updating canvas:", error);
    throw error;
  }
};

export const fetchInitialCanvasElements = async (canvasId) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/load/${canvasId}`,
      { headers: getAuthHeaders() }
    );
    return response.data.elements;
  } catch (error) {
    console.error("Error fetching canvas elements:", error);
    throw error;
  }
};
