import { ELEMENT_ERASE_THRESHOLD } from "../constants";

/* ---------------- HELPERS ---------------- */

const distance = (x1, y1, x2, y2) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

/* ---------------- POINT ↔ LINE SEGMENT ---------------- */

export const isPointCloseToLine = (
  x1,
  y1,
  x2,
  y2,
  px,
  py,
  threshold = ELEMENT_ERASE_THRESHOLD
) => {
  const lineLength = distance(x1, y1, x2, y2);

  // Handle zero-length line
  if (lineLength === 0) {
    return distance(x1, y1, px, py) <= threshold;
  }

  // Projection factor (clamped to segment)
  const t =
    ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) /
    (lineLength * lineLength);

  if (t < 0 || t > 1) return false;

  const closestX = x1 + t * (x2 - x1);
  const closestY = y1 + t * (y2 - y1);

  return distance(px, py, closestX, closestY) <= threshold;
};

/* ---------------- POINT ↔ POINT ---------------- */

export const isNearPoint = (x, y, x1, y1, threshold = 5) => {
  return distance(x, y, x1, y1) <= threshold;
};

/* ---------------- ARROW HEADS ---------------- */

export const getArrowHeadsCoordinates = (
  x1,
  y1,
  x2,
  y2,
  arrowLength
) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const offset = Math.PI / 6;

  return {
    x3: x2 - arrowLength * Math.cos(angle - offset),
    y3: y2 - arrowLength * Math.sin(angle - offset),
    x4: x2 - arrowLength * Math.cos(angle + offset),
    y4: y2 - arrowLength * Math.sin(angle + offset),
  };
};

/* ---------------- MIDPOINT ---------------- */

export const midPointBtw = (p1, p2) => ({
  x: p1.x + (p2.x - p1.x) / 2,
  y: p1.y + (p2.y - p1.y) / 2,
});
