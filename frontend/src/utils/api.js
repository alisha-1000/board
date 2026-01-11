// utils/api.js
import axios from "axios";

const API_BASE_URL =
  "https://board-1-lrt8.onrender.com/api/canvas";

/* ---------------- HELPERS ---------------- */

const getAuthHeaders = () => {
  const token = localStorage.getItem("whiteboard_user_token");
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
    console.error("❌ Error updating canvas:", error);
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
    console.error("❌ Error fetching canvas elements:", error);
    throw error;
  }
};
