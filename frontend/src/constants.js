/* ---------------- TOOLS ---------------- */

export const TOOL_ITEMS = Object.freeze({
  BRUSH: "BRUSH",
  LINE: "LINE",
  RECTANGLE: "RECTANGLE",
  CIRCLE: "CIRCLE",
  ARROW: "ARROW",
  ERASER: "ERASER",
  TEXT: "TEXT",
  COMMENT: "COMMENT",
});

/* ---------------- TOOL ACTION TYPES ---------------- */

export const TOOL_ACTION_TYPES = Object.freeze({
  NONE: "NONE",
  DRAWING: "DRAWING",
  ERASING: "ERASING",
  WRITING: "WRITING",
});

/* ---------------- BOARD ACTIONS ---------------- */

export const BOARD_ACTIONS = Object.freeze({
  CHANGE_TOOL: "CHANGE_TOOL",
  DRAW_DOWN: "DRAW_DOWN",
  DRAW_MOVE: "DRAW_MOVE",
  DRAW_UP: "DRAW_UP",
  ERASE: "ERASE",
  CHANGE_ACTION_TYPE: "CHANGE_ACTION_TYPE",
  CHANGE_TEXT: "CHANGE_TEXT",
  UNDO: "UNDO",
  REDO: "REDO",
  SET_INITIAL_ELEMENTS: "SET_INITIAL_ELEMENTS",
  SET_CANVAS_ID: "SET_CANVAS_ID",
  SET_CANVAS_ELEMENTS: "SET_CANVAS_ELEMENTS",
  SET_HISTORY: "SET_HISTORY",
  SET_USER_LOGIN_STATUS: "SET_USER_LOGIN_STATUS",
  SET_USER: "SET_USER",
});

/* ---------------- COLORS ---------------- */

export const COLORS = Object.freeze({
  BLACK: "#000000",
  RED: "#ff0000",
  GREEN: "#00ff00",
  BLUE: "#0000ff",
  ORANGE: "#ffa500",
  YELLOW: "#ffff00",
  WHITE: "#f8f8f8", // softer white (better UX)
});

/* ---------------- TOOLBOX ACTIONS ---------------- */

export const TOOLBOX_ACTIONS = Object.freeze({
  CHANGE_STROKE: "CHANGE_STROKE",
  CHANGE_FILL: "CHANGE_FILL",
  CHANGE_SIZE: "CHANGE_SIZE",
});

/* ---------------- TOOL GROUPS ---------------- */

export const FILL_TOOL_TYPES = [
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
];

export const STROKE_TOOL_TYPES = [
  TOOL_ITEMS.BRUSH,
  TOOL_ITEMS.LINE,
  TOOL_ITEMS.ARROW,
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
  TOOL_ITEMS.TEXT,
];

export const SIZE_TOOL_TYPES = [
  TOOL_ITEMS.BRUSH,     // ✅ added
  TOOL_ITEMS.LINE,
  TOOL_ITEMS.ARROW,
  TOOL_ITEMS.RECTANGLE,
  TOOL_ITEMS.CIRCLE,
  TOOL_ITEMS.TEXT,
];

/* ---------------- DRAWING CONSTANTS ---------------- */

export const ARROW_LENGTH = 20;

/**
 * Pixel threshold for eraser hit-testing.
 * Tuned for projection-based math.
 */
export const ELEMENT_ERASE_THRESHOLD = 6;
