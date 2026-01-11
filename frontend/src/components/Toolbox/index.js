import React, { useContext } from "react";
import cx from "classnames";
import classes from "./index.module.css";
import {
  COLORS,
  FILL_TOOL_TYPES,
  SIZE_TOOL_TYPES,
  STROKE_TOOL_TYPES,
  TOOL_ITEMS,
} from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import boardContext from "../../store/board-context";

const Toolbox = () => {
  const { activeToolItem } = useContext(boardContext);
  const { toolboxState, changeStroke, changeFill, changeSize } =
    useContext(toolboxContext);

  const currentToolState = toolboxState[activeToolItem] || {};
  const { stroke: strokeColor, fill: fillColor, size } = currentToolState;

  return (
    <div className={classes.container}>
      {/* STROKE */}
      {STROKE_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>Stroke Color</div>
          <div className={classes.colorsContainer}>
            <input
              className={classes.colorPicker}
              type="color"
              value={strokeColor}
              onChange={(e) => changeStroke(activeToolItem, e.target.value)}
            />
            {Object.keys(COLORS).map((k) => (
              <div
                key={k}
                className={cx(classes.colorBox, {
                  [classes.activeColorBox]: strokeColor === COLORS[k],
                })}
                style={{ backgroundColor: COLORS[k] }}
                onClick={() => changeStroke(activeToolItem, COLORS[k])}
              />
            ))}
          </div>
        </div>
      )}

      {/* FILL */}
      {FILL_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>Fill Color</div>
          <div className={classes.colorsContainer}>
            {fillColor !== null && (
              <input
                className={classes.colorPicker}
                type="color"
                value={fillColor}
                onChange={(e) => changeFill(activeToolItem, e.target.value)}
              />
            )}
            <div
              className={cx(classes.colorBox, classes.noFillColorBox, {
                [classes.activeColorBox]: fillColor === null,
              })}
              onClick={() => changeFill(activeToolItem, null)}
            />
            {Object.keys(COLORS).map((k) => (
              <div
                key={k}
                className={cx(classes.colorBox, {
                  [classes.activeColorBox]: fillColor === COLORS[k],
                })}
                style={{ backgroundColor: COLORS[k] }}
                onClick={() => changeFill(activeToolItem, COLORS[k])}
              />
            ))}
          </div>
        </div>
      )}

      {/* SIZE */}
      {SIZE_TOOL_TYPES.includes(activeToolItem) && (
        <div className={classes.selectOptionContainer}>
          <div className={classes.toolBoxLabel}>
            {activeToolItem === TOOL_ITEMS.TEXT ? "Font Size" : "Brush Size"} :{" "}
            {size}
          </div>
          <input
            type="range"
            min={activeToolItem === TOOL_ITEMS.TEXT ? 12 : 1}
            max={activeToolItem === TOOL_ITEMS.TEXT ? 64 : 10}
            step={1}
            value={size}
            onChange={(e) =>
              changeSize(activeToolItem, Number(e.target.value))
            }
          />
        </div>
      )}
    </div>
  );
};

export default Toolbox;
