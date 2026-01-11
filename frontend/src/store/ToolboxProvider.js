import React, { useReducer } from "react";
import toolboxContext from "./toolbox-context";
import { COLORS, TOOLBOX_ACTIONS, TOOL_ITEMS } from "../constants";

/* ---------------- REDUCER ---------------- */

function toolboxReducer(state, action) {
  const { tool } = action.payload || {};

  switch (action.type) {
    case TOOLBOX_ACTIONS.CHANGE_STROKE:
      return {
        ...state,
        [tool]: {
          ...state[tool],
          stroke: action.payload.stroke,
        },
      };

    case TOOLBOX_ACTIONS.CHANGE_FILL:
      return {
        ...state,
        [tool]: {
          ...state[tool],
          fill: action.payload.fill,
        },
      };

    case TOOLBOX_ACTIONS.CHANGE_SIZE:
      return {
        ...state,
        [tool]: {
          ...state[tool],
          size: action.payload.size,
        },
      };

    default:
      return state;
  }
}

/* ---------------- INITIAL STATE ---------------- */

const initialToolboxState = {
  [TOOL_ITEMS.BRUSH]: {
    stroke: COLORS.BLACK,
    size: 4, // ✅ added
  },
  [TOOL_ITEMS.LINE]: {
    stroke: COLORS.BLACK,
    size: 1,
  },
  [TOOL_ITEMS.RECTANGLE]: {
    stroke: COLORS.BLACK,
    fill: null,
    size: 1,
  },
  [TOOL_ITEMS.CIRCLE]: {
    stroke: COLORS.BLACK,
    fill: null,
    size: 1,
  },
  [TOOL_ITEMS.ARROW]: {
    stroke: COLORS.BLACK,
    size: 1,
  },
  [TOOL_ITEMS.TEXT]: {
    stroke: COLORS.BLACK,
    size: 32,
  },
};

/* ---------------- PROVIDER ---------------- */

const ToolboxProvider = ({ children }) => {
  const [toolboxState, dispatchToolboxAction] = useReducer(
    toolboxReducer,
    initialToolboxState
  );

  const changeStroke = (tool, stroke) =>
    dispatchToolboxAction({
      type: TOOLBOX_ACTIONS.CHANGE_STROKE,
      payload: { tool, stroke },
    });

  const changeFill = (tool, fill) =>
    dispatchToolboxAction({
      type: TOOLBOX_ACTIONS.CHANGE_FILL,
      payload: { tool, fill },
    });

  const changeSize = (tool, size) =>
    dispatchToolboxAction({
      type: TOOLBOX_ACTIONS.CHANGE_SIZE,
      payload: { tool, size },
    });

  return (
    <toolboxContext.Provider
      value={{ toolboxState, changeStroke, changeFill, changeSize }}
    >
      {children}
    </toolboxContext.Provider>
  );
};

export default ToolboxProvider;
