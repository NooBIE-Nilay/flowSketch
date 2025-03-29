import { RoughGenerator } from "roughjs/bin/generator";
import { Tools } from "./config";
import { element_type, point } from "./types";
import { RoughCanvas } from "roughjs/bin/canvas";
import getStroke from "perfect-freehand";

export const average = (a: number, b: number) => (a + b) / 2;
export const distance = (a: point, b: point) => {
  if (a[0] && b[0] && a[1] && b[1]) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }
  return 0; // Return 0 if inputs are invalid
};
export function getSvgPathFromStroke(points: point[], closed = true) {
  const len = points.length;
  if (len < 4) {
    return ``;
  }
  let a = points[0];
  let b = points[1];
  const c = points[2];
  // @ts-ignore
  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(b[1], c[1]).toFixed(2)} T`;
  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    // @ts-ignore
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(2)} `;
  }
  if (closed) {
    result += "Z";
  }
  return result;
}

export const createElement = (
  generator: RoughGenerator,
  id: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tool: string,
  color: string = "primary"
) => {
  let roughElement = undefined;
  switch (tool) {
    case Tools.RECTANGLE:
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
      break;
    case Tools.LINE:
      roughElement = generator.line(x1, y1, x2, y2);
      break;
    case Tools.CIRCLE:
      roughElement = generator.circle(x1, y1, 2 * distance([x1, y1], [x2, y2]));
      break;
    case Tools.PENCIL:
      return { id, tool, color, points: [[x1, y1]], x1, y1, x2, y2 };
    default:
      throw new Error(`Tool Not Recognized ${tool}`);
  }
  return { id, x1, y1, x2, y2, roughElement, tool, color };
};

export const nearPoint = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  name: string
) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};
export const onLine = (v1: point, v2: point, p: point, maxOffset = 1) => {
  const offset = distance(v1, v2) - (distance(v1, p) + distance(v2, p));
  return Math.abs(offset) < maxOffset ? "inside" : null;
};
export const getPositionWithinElement = (
  x: number,
  y: number,
  element: element_type
) => {
  const { x1, y1, x2, y2 } = element;
  switch (element.tool) {
    case Tools.LINE:
      const insideLine = onLine([x1, y1], [x2, y2], [x, y]);
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      return start || end || insideLine;
      break;
    case Tools.RECTANGLE:
      const topLeft = nearPoint(x, y, x1, y1, "tl");
      const topRight = nearPoint(x, y, x2, y1, "tr");
      const bottomLeft = nearPoint(x, y, x1, y2, "bl");
      const bottomRight = nearPoint(x, y, x2, y2, "br");
      const insideRect =
        x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
      return topLeft || topRight || bottomLeft || bottomRight || insideRect;
    case Tools.CIRCLE:
      const radius = distance([x1, y1], [x2, y2]);
      const a = [x1, y1];
      const b = [x, y];
      const insideCircle = distance(a, b) <= radius ? "inside" : null;
      const nearCircumferance =
        Math.abs(distance(a, b) - radius) <= 5 ? "near" : null;
      return nearCircumferance || insideCircle;
    case Tools.PENCIL:
      const betweenAnyPoint = element.points?.some((point, index) => {
        if (!element.points) return false;
        const nextPoint = element.points[index + 1];
        if (!nextPoint) return false;
        return onLine(point, nextPoint, [x, y], 5) != null;
      });
      return betweenAnyPoint ? "inside" : null;
    default:
      return null;
  }
};

export const standardiseElementCoordinates = (element: element_type) => {
  const { x1, y1, x2, y2, tool } = element;
  if (tool === Tools.RECTANGLE) {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return { x1: minX, y1: minY, x2: maxX, y2: maxY };
  } else if (tool === Tools.LINE) {
    if (x1 < x2 || (x1 == x2 && y1 < y2)) return { x1, y1, x2, y2 };
    else return { x1: x2, y1: y2, x2: x1, y2: y1 };
  }
  return { x1, y1, x2, y2 };
};

export const cursorForPosition = (position: string | null) => {
  if (!position || position === null) return "default";
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
    case "near":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};
export const resizedCoordinates = (
  clientX: number,
  clientY: number,
  position: string | null,
  coordinates: { x1: number; y1: number; x2: number; y2: number }
) => {
  const { x1, x2, y1, y2 } = coordinates;
  switch (position) {
    case "tl":
    case "start":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x2: clientX, y1: clientY, x1, y2 };
    case "bl":
      return { x1: clientX, y2: clientY, x2, y1 };
    case "br":
    case "near":
    case "end":
      return { x2: clientX, y2: clientY, x1, y1 };
    default:
      return { ...coordinates };
  }
};

export const renderElement = (
  roughCanvas: RoughCanvas,
  ctx: CanvasRenderingContext2D,
  element: element_type,
  strokeColor: string
) => {
  if (element.roughElement) {
    element.roughElement.options.stroke = strokeColor;
    element.roughElement.options.strokeWidth = 2;
    roughCanvas.draw(element.roughElement);
  } else {
    if (!element.points) return;
    const stroke = getSvgPathFromStroke(getStroke(element.points, { size: 6 }));
    ctx.fillStyle = strokeColor;
    ctx.fill(new Path2D(stroke));
  }
};
export const getElementAtPosition = (
  x: number,
  y: number,
  elements: element_type[]
) => {
  return elements
    .map((element) => ({
      ...element,
      position: getPositionWithinElement(x, y, element),
    }))
    .find((element) => element.position !== null);
};
