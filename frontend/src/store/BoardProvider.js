// import React, { useCallback, useReducer } from "react";
import React, { useReducer } from "react";

import boardContext from "./board-context";
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from "../constants";
import { createElement, isPointNearElement } from "../utils/element";

/* ---------------- REDUCER ---------------- */

const boardReducer = (state, action) => {
  switch (action.type) {
    case BOARD_ACTIONS.CHANGE_TOOL:
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
      elements[elements.length - 1].text = action.payload.text;

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

    case BOARD_ACTIONS.SET_CANVAS_ID:
      return { ...state, canvasId: action.payload.canvasId };

    case BOARD_ACTIONS.SET_USER_LOGIN_STATUS:
      return { ...state, isUserLoggedIn: action.payload.isUserLoggedIn };

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
  isUserLoggedIn: !!localStorage.getItem("whiteboard_user_token"),
};

/* ---------------- PROVIDER ---------------- */

const BoardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(boardReducer, initialBoardState);

  const changeToolHandler = (tool) =>
    dispatch({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } });

  const boardMouseDownHandler = (e, toolboxState) => {
    if (state.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

    const { clientX, clientY } = e;

    if (state.activeToolItem === TOOL_ITEMS.ERASER) {
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
        stroke: toolboxState[state.activeToolItem]?.stroke,
        fill: toolboxState[state.activeToolItem]?.fill,
        size: toolboxState[state.activeToolItem]?.size,
      },
    });
  };

  const boardMouseMoveHandler = (e) => {
    if (
      state.toolActionType !== TOOL_ACTION_TYPES.DRAWING &&
      state.toolActionType !== TOOL_ACTION_TYPES.ERASING
    )
      return;

    dispatch({
      type:
        state.toolActionType === TOOL_ACTION_TYPES.ERASING
          ? BOARD_ACTIONS.ERASE
          : BOARD_ACTIONS.DRAW_MOVE,
      payload: { clientX: e.clientX, clientY: e.clientY },
    });
  };

  const boardMouseUpHandler = () => {
    if (state.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
      dispatch({ type: BOARD_ACTIONS.DRAW_UP });
    }

    dispatch({
      type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
      payload: { actionType: TOOL_ACTION_TYPES.NONE },
    });
  };

  const contextValue = {
    activeToolItem: state.activeToolItem,
    elements: state.elements,
    toolActionType: state.toolActionType,
    canvasId: state.canvasId,
    isUserLoggedIn: state.isUserLoggedIn,
    changeToolHandler,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    undo: () => dispatch({ type: BOARD_ACTIONS.UNDO }),
    redo: () => dispatch({ type: BOARD_ACTIONS.REDO }),
    setCanvasId: (canvasId) =>
      dispatch({ type: BOARD_ACTIONS.SET_CANVAS_ID, payload: { canvasId } }),
    setElements: (elements) =>
      dispatch({
        type: BOARD_ACTIONS.SET_CANVAS_ELEMENTS,
        payload: { elements },
      }),
    setUserLoginStatus: (isUserLoggedIn) =>
      dispatch({
        type: BOARD_ACTIONS.SET_USER_LOGIN_STATUS,
        payload: { isUserLoggedIn },
      }),
  };

  return (
    <boardContext.Provider value={contextValue}>
      {children}
    </boardContext.Provider>
  );
};

export default BoardProvider;
