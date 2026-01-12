import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import toolboxContext from "../../store/toolbox-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import { getSocket } from "../../utils/socket";
import { getSvgPathFromStroke } from "../../utils/element";
import getStroke from "perfect-freehand";
import classes from "./index.module.css";

function Board({ id }) {
  const canvasRef = useRef(null);
  const textAreaRef = useRef(null);

  const {
    elements,
    toolActionType,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    textAreaBlurHandler,
    undo,
    redo,
    setCanvasId,
    setElements,
    setHistory,
  } = useContext(boardContext);

  const { toolboxState } = useContext(toolboxContext);
  const [isAuthorized, setIsAuthorized] = useState(true);

  /* ---------------- SET CANVAS ID (CRITICAL FIX) ---------------- */
  useEffect(() => {
    if (!id) return;
    // 🔥 ALWAYS set canvasId (independent of socket)
    setCanvasId(id);
  }, [id, setCanvasId]);

  /* ---------------- SOCKET SETUP ---------------- */
  useEffect(() => {
    if (!id) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit("joinCanvas", { canvasId: id });

    const handleReceive = (updatedElements) => {
      setElements(updatedElements);
      setHistory(updatedElements);
    };

    const handleLoad = (initialElements) => {
      setElements(initialElements);
      setHistory(initialElements);
    };

    const handleUnauthorized = () => {
      alert("Access Denied: You cannot edit this canvas.");
      setIsAuthorized(false);
    };

    socket.on("receiveDrawingUpdate", handleReceive);
    socket.on("loadCanvas", handleLoad);
    socket.on("unauthorized", handleUnauthorized);

    return () => {
      socket.off("receiveDrawingUpdate", handleReceive);
      socket.off("loadCanvas", handleLoad);
      socket.off("unauthorized", handleUnauthorized);
    };
  }, [id, setElements, setHistory]);

  /* ---------------- CANVAS SIZE ---------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  /* ---------------- KEYBOARD SHORTCUTS ---------------- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") undo();
      if (e.ctrlKey && e.key === "y") redo();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  /* ---------------- DRAWING ---------------- */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    const roughCanvas = rough.canvas(canvas);

    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE:
        case TOOL_ITEMS.RECTANGLE:
        case TOOL_ITEMS.CIRCLE:
        case TOOL_ITEMS.ARROW:
          roughCanvas.draw(element.roughEle);
          break;

        case TOOL_ITEMS.BRUSH: {
          context.fillStyle = element.stroke;

          const stroke = getStroke(element.points, {
            size: element.size,
            thinning: 0.6,
            smoothing: 0.5,
            streamline: 0.5,
          });

          const path = new Path2D(getSvgPathFromStroke(stroke));
          context.fill(path);
          break;
        }

        case TOOL_ITEMS.TEXT:
          context.textBaseline = "top";
          context.font = `${element.size}px Caveat`;
          context.fillStyle = element.stroke;
          context.fillText(element.text, element.x1, element.y1);
          break;

        default:
          break;
      }
    });
  }, [elements]);

  /* ---------------- TEXT TOOL FOCUS ---------------- */
  useEffect(() => {
    if (toolActionType === TOOL_ACTION_TYPES.WRITING) {
      setTimeout(() => textAreaRef.current?.focus(), 0);
    }
  }, [toolActionType]);

  /* ---------------- MOUSE HANDLERS ---------------- */
  const handleMouseDown = (e) => {
    if (!isAuthorized) return;
    boardMouseDownHandler(e, toolboxState);
  };

  const handleMouseMove = (e) => {
    if (!isAuthorized) return;
    boardMouseMoveHandler(e);
  };

  const handleMouseUp = () => {
    if (!isAuthorized) return;

    boardMouseUpHandler();

    const socket = getSocket();
    socket?.emit("drawingUpdate", { canvasId: id, elements });
  };

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && elements.length > 0 && (
        <textarea
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: elements[elements.length - 1].y1,
            left: elements[elements.length - 1].x1,
            fontSize: `${elements[elements.length - 1].size}px`,
            color: elements[elements.length - 1].stroke,
          }}
          onBlur={(e) => textAreaBlurHandler(e.target.value)}
        />
      )}

      <canvas
        ref={canvasRef}
        id="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </>
  );
}

export default Board;
