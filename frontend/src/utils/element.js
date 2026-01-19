import { ARROW_LENGTH, TOOL_ITEMS } from "../constants";
import getStroke from "perfect-freehand";
import rough from "roughjs/bin/rough";
import { getArrowHeadsCoordinates, isPointCloseToLine } from "./math";

const gen = rough.generator();

/* ---------------- CREATE ELEMENT ---------------- */

export const createElement = (
  id,
  x1,
  y1,
  x2,
  y2,
  { type, stroke, fill, size }
) => {
  const element = {
    id,
    x1,
    y1,
    x2,
    y2,
    type,
    stroke,
    fill,
    size,
  };

  const options = {
    seed: id + 1,
    stroke,
    fill: fill ? fill : undefined, // Ensure no-fill if null
    strokeWidth: size,
    fillStyle: "solid",
  };

  switch (type) {
    case TOOL_ITEMS.BRUSH:
      return {
        id,
        type,
        stroke,
        size,
        points: [{ x: x1, y: y1 }],
      };

    case TOOL_ITEMS.LINE:
      element.roughEle = gen.line(x1, y1, x2, y2, options);
      return element;

    case TOOL_ITEMS.RECTANGLE:
      element.roughEle = gen.rectangle(x1, y1, x2 - x1, y2 - y1, options);
      return element;

    case TOOL_ITEMS.CIRCLE: {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      element.roughEle = gen.ellipse(cx, cy, x2 - x1, y2 - y1, options);
      return element;
    }

    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
        x1,
        y1,
        x2,
        y2,
        ARROW_LENGTH
      );
      element.roughEle = gen.linearPath(
        [
          [x1, y1],
          [x2, y2],
          [x3, y3],
          [x2, y2],
          [x4, y4],
        ],
        options
      );
      return element;
    }

    case TOOL_ITEMS.TEXT:
      element.text = "";
      return element;

    default:
      throw new Error("Type not recognized");
  }
};

/* ---------------- RESTORE ELEMENT ---------------- */

export const restoreElements = (element) => {
  const { id, x1, y1, x2, y2, type, stroke, fill, size } = element;

  const options = {
    seed: id + 1,
    stroke,
    fill,
    strokeWidth: size,
    fillStyle: "solid",
  };

  switch (type) {
    case TOOL_ITEMS.BRUSH:
    case TOOL_ITEMS.TEXT:
      // These types don't use roughEle or valid points are sufficient
      return element;

    case TOOL_ITEMS.LINE:
      element.roughEle = gen.line(x1, y1, x2, y2, options);
      return element;

    case TOOL_ITEMS.RECTANGLE:
      element.roughEle = gen.rectangle(x1, y1, x2 - x1, y2 - y1, options);
      return element;

    case TOOL_ITEMS.CIRCLE: {
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      element.roughEle = gen.ellipse(cx, cy, x2 - x1, y2 - y1, options);
      return element;
    }

    case TOOL_ITEMS.ARROW: {
      const { x3, y3, x4, y4 } = getArrowHeadsCoordinates(
        x1,
        y1,
        x2,
        y2,
        ARROW_LENGTH
      );
      element.roughEle = gen.linearPath(
        [
          [x1, y1],
          [x2, y2],
          [x3, y3],
          [x2, y2],
          [x4, y4],
        ],
        options
      );
      return element;
    }

    default:
      console.warn("restoreElements: Type not recognized", type);
      return element;
  }
};

/* ---------------- HIT TESTING ---------------- */

export const isPointNearElement = (element, x, y) => {
  const canvas = document.getElementById("canvas");
  if (!canvas) return false;

  const ctx = canvas.getContext("2d");
  const { x1, y1, x2, y2, type } = element;

  switch (type) {
    case TOOL_ITEMS.LINE:
    case TOOL_ITEMS.ARROW:
      return isPointCloseToLine(x1, y1, x2, y2, x, y);

    case TOOL_ITEMS.RECTANGLE:
    case TOOL_ITEMS.CIRCLE:
      return (
        isPointCloseToLine(x1, y1, x2, y1, x, y) ||
        isPointCloseToLine(x2, y1, x2, y2, x, y) ||
        isPointCloseToLine(x2, y2, x1, y2, x, y) ||
        isPointCloseToLine(x1, y2, x1, y1, x, y)
      );

    case TOOL_ITEMS.BRUSH: {
      const stroke = getStroke(element.points);
      const path = new Path2D(getSvgPathFromStroke(stroke));
      return ctx.isPointInPath(path, x, y);
    }

    case TOOL_ITEMS.TEXT: {
      ctx.save();
      ctx.font = `${element.size}px Caveat`;
      const width = ctx.measureText(element.text).width;
      const height = element.size;
      ctx.restore();

      return (
        isPointCloseToLine(x1, y1, x1 + width, y1, x, y) ||
        isPointCloseToLine(x1 + width, y1, x1 + width, y1 + height, x, y) ||
        isPointCloseToLine(x1 + width, y1 + height, x1, y1 + height, x, y) ||
        isPointCloseToLine(x1, y1 + height, x1, y1, x, y)
      );
    }

    default:
      return false;
  }
};

/* ---------------- SVG PATH ---------------- */

export const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
};
