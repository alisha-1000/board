import React, { useReducer, useMemo, useCallback } from "react";
import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import { createElement, isPointNearElement } from "../utils/element";

/* ---------------- REDUCER ---------------- */

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL:
      console.log("Reducer: CHANGE_TOOL", action.payload.tool);
      return { ...state, activeToolItem: action.payload.tool };

    case BOARD_ACTIONS.CHANGE_ACTION_TYPE:
      return { ...state, toolActionType: action.payload.actionType };

    case BOARD_ACTIONS.DRAW_DOWN: {
      const { clientX, clientY, stroke, fill, size } = action.payload;

      const newElement = createElement(
        state.elements.length,
        clientX,
        clientY,
        clientX,
        clientY,
        { type: state.activeToolItem, stroke, fill, size }
      );

      return {
        ...state,
        toolActionType:
          state.activeToolItem === TOOL_ITEMS.TEXT
            ? TOOL_ACTION_TYPES.WRITING
            : TOOL_ACTION_TYPES.DRAWING,
        elements: [...state.elements, newElement],
      };
    }

    case BOARD_ACTIONS.DRAW_MOVE: {
      const { clientX, clientY } = action.payload;
      const elements = [...state.elements];
      const index = elements.length - 1;
      const element = elements[index];

      if (!element) return state;

      if (element.type === TOOL_ITEMS.BRUSH) {
        element.points.push({ x: clientX, y: clientY });
      } else {
        elements[index] = createElement(
          index,
          element.x1,
          element.y1,
          clientX,
          clientY,
          element
        );
      }

      return { ...state, elements };
    }

    case BOARD_ACTIONS.DRAW_UP: {
      const snapshot = JSON.parse(JSON.stringify(state.elements));
      const history = state.history.slice(0, state.index + 1);

      return {
        ...state,
        history: [...history, snapshot],
        index: history.length,
      };
    }

    case BOARD_ACTIONS.ERASE: {
      const { clientX, clientY } = action.payload;

      const filtered = state.elements.filter(
        (el) => !isPointNearElement(el, clientX, clientY)
      );

      const snapshot = JSON.parse(JSON.stringify(filtered));
      const history = state.history.slice(0, state.index + 1);

      return {
        ...state,
        elements: filtered,
        history: [...history, snapshot],
        index: history.length,
      };
    }

    case BOARD_ACTIONS.CHANGE_TEXT: {
      const elements = [...state.elements];
      const index = elements.length - 1;
      if (index >= 0) {
        elements[index] = {
          ...elements[index],
          text: action.payload.text,
        };
      }

      const snapshot = JSON.parse(JSON.stringify(elements));
      const history = state.history.slice(0, state.index + 1);

      return {
        ...state,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements,
        history: [...history, snapshot],
        index: history.length,
      };
    }

    case BOARD_ACTIONS.UNDO:
      if (state.index <= 0) return state;
      return {
        ...state,
        elements: state.history[state.index - 1],
        index: state.index - 1,
      };

    case BOARD_ACTIONS.REDO:
      if (state.index >= state.history.length - 1) return state;
      return {
        ...state,
        elements: state.history[state.index + 1],
        index: state.index + 1,
      };

    case BOARD_ACTIONS.SET_CANVAS_ELEMENTS:
      return {
        ...state,
        elements: action.payload.elements,
        history: [JSON.parse(JSON.stringify(action.payload.elements))],
        index: 0,
      };

    case "SET_REMOTE_ELEMENTS":
      return {
        ...state,
        elements: action.payload.elements,
      };

    case BOARD_ACTIONS.SET_CANVAS_ID:
      return { ...state, canvasId: action.payload.canvasId };

    case BOARD_ACTIONS.SET_USER_LOGIN_STATUS:
      return { ...state, isUserLoggedIn: action.payload.isUserLoggedIn };

    case BOARD_ACTIONS.SET_USER:
      return { ...state, currentUser: action.payload.user };

    case "SET_SHARED_EMAILS":
      return { ...state, sharedEmails: action.payload.emails };

    case "SET_SOCKET":
      return { ...state, socket: action.payload };

    default:
      return state;
  }
};

/* ---------------- INITIAL STATE ---------------- */

const initialBoardState = {
  activeToolItem: TOOL_ITEMS.BRUSH,
  toolActionType: TOOL_ACTION_TYPES.NONE,
  elements: [],
  history: [[]],
  index: 0,
  canvasId: "",
  isUserLoggedIn: !!localStorage.getItem("token"),
  currentUser: null,
  sharedEmails: [],
  socket: null,
};

/* ---------------- PROVIDER ---------------- */

const BoardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialBoardState);

  /* ---------- TOOL HANDLERS ---------- */


  /* Reference to current state for use in callbacks */
  const stateRef = React.useRef(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /* ---------- SOCKET MANAGEMENT ---------- */
  React.useEffect(() => {
    const { connectSocket, disconnectSocket } = require("../utils/socket");
    let currentSocket = null;

    if (state.isUserLoggedIn) {
      currentSocket = connectSocket();
      dispatch({ type: "SET_SOCKET", payload: currentSocket });
    } else {
      disconnectSocket();
      dispatch({ type: "SET_SOCKET", payload: null });
    }

    return () => {
      // Clean up on unmount or if login status changes significantly
      // disconnectSocket(); // Removed because we want to keep it alive during navigation
    };
  }, [state.isUserLoggedIn]);

  /* ---------- TOOL HANDLERS ---------- */

  const changeToolHandler = useCallback((tool) => {
    dispatch({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } });
  }, []);

  const boardMouseDownHandler = useCallback((e, toolboxState) => {
    const currentState = stateRef.current;
    if (currentState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

    const { clientX, clientY } = e;

    if (currentState.activeToolItem === TOOL_ITEMS.ERASER) {
      dispatch({
        type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
        payload: { actionType: TOOL_ACTION_TYPES.ERASING },
      });
      return;
    }

    dispatch({
      type: BOARD_ACTIONS.DRAW_DOWN,
      payload: {
        clientX,
        clientY,
        stroke: toolboxState[currentState.activeToolItem]?.stroke,
        fill: toolboxState[currentState.activeToolItem]?.fill,
        size: toolboxState[currentState.activeToolItem]?.size,
      },
    });
  }, []);

  const boardMouseMoveHandler = useCallback((e) => {
    const currentState = stateRef.current;
    if (
      currentState.toolActionType !== TOOL_ACTION_TYPES.DRAWING &&
      currentState.toolActionType !== TOOL_ACTION_TYPES.ERASING
    )
      return;

    dispatch({
      type:
        currentState.toolActionType === TOOL_ACTION_TYPES.ERASING
          ? BOARD_ACTIONS.ERASE
          : BOARD_ACTIONS.DRAW_MOVE,
      payload: { clientX: e.clientX, clientY: e.clientY },
    });
  }, []);

  const boardMouseUpHandler = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

    if (currentState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatch({ type: BOARD_ACTIONS.DRAW_UP });
    }

    dispatch({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: { actionType: TOOL_ACTION_TYPES.NONE },
    });
  }, []);

  /* Textarea Blur Handler */
  const textAreaBlurHandler = useCallback((text) => {
    const currentState = stateRef.current;
    if (text === undefined || text === null) return;
    if (currentState.elements.length === 0) return;

    dispatch({
      type: BOARD_ACTIONS.CHANGE_TEXT,
      payload: { text },
    });
  }, []);

  /* ---------- STABLE DISPATCH ACTIONS ---------- */

  const undo = useCallback(() => dispatch({ type: BOARD_ACTIONS.UNDO }), []);
  const redo = useCallback(() => dispatch({ type: BOARD_ACTIONS.REDO }), []);

  const setCanvasId = useCallback((canvasId) =>
    dispatch({
      type: BOARD_ACTIONS.SET_CANVAS_ID,
      payload: { canvasId },
    }), []);

  const setElements = useCallback((elements) =>
    dispatch({
      type: BOARD_ACTIONS.SET_CANVAS_ELEMENTS,
      payload: { elements },
    }), []);

  const setRemoteElements = useCallback((elements) =>
    dispatch({
      type: "SET_REMOTE_ELEMENTS",
      payload: { elements },
    }), []);

  const setUserLoginStatus = useCallback((isUserLoggedIn) =>
    dispatch({
      type: BOARD_ACTIONS.SET_USER_LOGIN_STATUS,
      payload: { isUserLoggedIn },
    }), []);

  const setCurrentUser = useCallback((user) =>
    dispatch({
      type: BOARD_ACTIONS.SET_USER,
      payload: { user },
    }), []);

  const setSharedEmails = useCallback((emails) =>
    dispatch({
      type: "SET_SHARED_EMAILS",
      payload: { emails },
    }), []);

  /* ---------- CONTEXT VALUE ---------- */

  const contextValue = useMemo(() => ({
    activeToolItem: state.activeToolItem,
    elements: state.elements,
    toolActionType: state.toolActionType,
    canvasId: state.canvasId,
    isUserLoggedIn: state.isUserLoggedIn,
    currentUser: state.currentUser,
    sharedEmails: state.sharedEmails,
    socket: state.socket,

    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,

    undo,
    redo,
    setCanvasId,
    setElements,
    setRemoteElements,
    setUserLoginStatus,
    setCurrentUser,
    setSharedEmails,
  }), [
    state.activeToolItem,
    state.elements,
    state.toolActionType,
    state.canvasId,
    state.isUserLoggedIn,
    state.currentUser,
    state.sharedEmails,
    state.socket,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo,
    redo,
    setCanvasId,
    setElements,
    setRemoteElements,
    setUserLoginStatus,
    setCurrentUser,
    setSharedEmails
  ]);

  return (
    <boardContext.Provider value={contextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;
