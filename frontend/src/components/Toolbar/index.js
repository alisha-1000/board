import React, { useContext } from "react";
import classes from "./index.module.css";
import cx from "classnames";
import {
  FaSlash,
  FaRegCircle,
  FaArrowRight,
  FaPaintBrush,
  FaEraser,
  FaUndoAlt,
  FaRedoAlt,
  FaFont,
  FaDownload,
} from "react-icons/fa";
import { LuRectangleHorizontal } from "react-icons/lu";
import { TOOL_ITEMS } from "../../constants";
import boardContext from "../../store/board-context";

const Toolbar = () => {
  const { activeToolItem, changeToolHandler, undo, redo } =
    useContext(boardContext);

  const handleDownloadClick = () => {
    const canvas = document.getElementById("canvas");
    if (!canvas) return; // ✅ safety check

    const data = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = data;
    anchor.download = "board.png";
    anchor.click();
  };

  return (
    <nav className={classes.container} aria-label="Drawing Toolbar">
      <ul className={classes.toolList}>
        <li
          title="Brush"
          role="button"
          aria-label="Select Brush Tool"
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.BRUSH,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.BRUSH)}
        >
          <FaPaintBrush aria-hidden="true" />
        </li>

        <li
          title="Line"
          role="button"
          aria-label="Select Line Tool"
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.LINE,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.LINE)}
        >
          <FaSlash aria-hidden="true" />
        </li>

        <li
          title="Rectangle"
          role="button"
          aria-label="Select Rectangle Tool"
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.RECTANGLE,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.RECTANGLE)}
        >
          <LuRectangleHorizontal aria-hidden="true" />
        </li>

        <li
          title="Circle"
          role="button"
          aria-label="Select Circle Tool"
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.CIRCLE,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.CIRCLE)}
        >
          <FaRegCircle aria-hidden="true" />
        </li>

        <li
          title="Arrow"
          role="button"
          aria-label="Select Arrow Tool"
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.ARROW,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.ARROW)}
        >
          <FaArrowRight aria-hidden="true" />
        </li>

        <li
          title="Eraser"
          role="button"
          aria-label="Select Eraser Tool"
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.ERASER,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.ERASER)}
        >
          <FaEraser aria-hidden="true" />
        </li>

        <li
          title="Text"
          role="button"
          aria-label="Select Text Tool"
          className={cx(classes.toolItem, {
            [classes.active]: activeToolItem === TOOL_ITEMS.TEXT,
          })}
          onClick={() => changeToolHandler(TOOL_ITEMS.TEXT)}
        >
          <FaFont aria-hidden="true" />
        </li>



        <li title="Undo" role="button" aria-label="Undo last action" className={classes.toolItem} onClick={undo}>
          <FaUndoAlt aria-hidden="true" />
        </li>

        <li title="Redo" role="button" aria-label="Redo last action" className={classes.toolItem} onClick={redo}>
          <FaRedoAlt aria-hidden="true" />
        </li>

        <li
          title="Download as PNG"
          role="button"
          aria-label="Download board as PNG image"
          className={classes.toolItem}
          onClick={handleDownloadClick}
        >
          <FaDownload aria-hidden="true" />
        </li>
      </ul>
    </nav>
  );
};

export default Toolbar;
