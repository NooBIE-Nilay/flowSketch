import { Button } from "@repo/ui/components/button";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import { Tools } from "@/lib/config";
import { useHistory } from "@/hooks/usehistory";
import { useTheme } from "next-themes";
import { ModeToggle } from "./modeToggle";
import { RoughCanvas } from "roughjs/bin/canvas";
import getStroke from "perfect-freehand";

const generator = rough.generator();

// TODO: Refactor Code
type element_type = {
  tool: string;
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roughElement?: Drawable;
  points?: point[];
  color: string;
};
type point = number[];
interface selected_element_type extends element_type {
  offsetX?: number;
  offsetY?: number;
  position: string | null;
  offsetXArray?: number[];
  offsetYArray?: number[];
}
const average = (a: number, b: number) => (a + b) / 2;
const distance = (a: point, b: point) => {
  if (a[0] && b[0] && a[1] && b[1]) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }
  return 0; // Return 0 if inputs are invalid
};
function getSvgPathFromStroke(points: point[], closed = true) {
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

const createElement = (
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

const nearPoint = (
  x: number,
  y: number,
  x1: number,
  y1: number,
  name: string
) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
};
const onLine = (v1: point, v2: point, p: point, maxOffset = 1) => {
  const offset = distance(v1, v2) - (distance(v1, p) + distance(v2, p));
  return Math.abs(offset) < maxOffset ? "inside" : null;
};
const getPositionWithinElement = (
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

const standardiseElementCoordinates = (element: element_type) => {
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

const cursorForPosition = (position: string | null) => {
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
const resizedCoordinates = (
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
export default function Canvas({
  socket,
  roomId,
  token,
}: {
  socket: WebSocket;
  roomId: string;
  token: string;
}) {
  const { theme } = useTheme();
  const strokeColor = theme === "light" ? "black" : "white";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements, Undo, Redo] = useHistory<element_type[]>([]);
  const [selectedElement, setSelectedElement] =
    useState<selected_element_type>();
  const [action, setAction] = useState("none");
  const [selectedTool, setSelectedTool] = useState(Tools.SELECTION);
  const [startPanMousePosition, setStartPanMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const roughCanvas = rough.canvas(canvas);
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);
      elements.forEach((element) => renderElement(roughCanvas, ctx, element));
      ctx.restore();
    }
  }, [elements, strokeColor, panOffset, action]);
  const panFunction = (event: WheelEvent) => {
    setPanOffset((prevState) => {
      return {
        x: prevState.x - event.deltaX,
        y: prevState.y - event.deltaY,
      };
    });
  };
  useEffect(() => {
    document.addEventListener("wheel", panFunction);
    return () => document.removeEventListener("wheel", panFunction);
  }, []);

  const renderElement = (
    roughCanvas: RoughCanvas,
    ctx: CanvasRenderingContext2D,
    element: element_type
  ) => {
    // if (Math.abs(panOffset.y) >= Math.min(element.y1, element.y2)) return;
    //element.roughElement exists for all primitive shapes except for  pencil tool
    if (element.roughElement) {
      element.roughElement.options.stroke = strokeColor;
      element.roughElement.options.strokeWidth = 2;
      roughCanvas.draw(element.roughElement);
    } else {
      if (!element.points) return;
      const stroke = getSvgPathFromStroke(
        getStroke(element.points, { size: 6 })
      );
      ctx.fillStyle = strokeColor;
      ctx.fill(new Path2D(stroke));
    }
  };
  const ClearCanvas = () => {
    setPanOffset({ x: 0, y: 0 });
    setElements([]);
  };

  const getElementAtPosition = (x: number, y: number) => {
    return elements
      .map((element) => ({
        ...element,
        position: getPositionWithinElement(x, y, element),
      }))
      .find((element) => element.position !== null);
  };

  const updateEelement = (
    index: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tool: string
  ) => {
    const currentElements = elements.map((element) => ({ ...element }));
    switch (tool) {
      case Tools.RECTANGLE:
      case Tools.CIRCLE:
      case Tools.LINE:
        currentElements[index] = createElement(index, x1, y1, x2, y2, tool);
        break;
      case Tools.PENCIL:
        //TODO: Very Ugly Code, Need To Fix
        const latestPoints = currentElements[index]?.points;
        if (!latestPoints) return;
        const latestPoint = latestPoints[latestPoints?.length - 1];
        if (latestPoint && distance(latestPoint, [x2, y2]) <= 5) break;
        currentElements[index]?.points?.push([x2, y2]);
        break;
      default:
        throw new Error(`Type Not Recognised: ${tool}`);
    }
    setElements(currentElements, true);
  };

  const getMouseCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const clientX = event.clientX - panOffset.x;
    const clientY = event.clientY - panOffset.y;
    console.log(
      "e:",
      event.clientX,
      event.clientY,
      " panned:",
      clientX,
      clientY
    );
    return { clientX, clientY };
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    //To Check If it is RightClick / LeftClick
    if (e.button === 0) {
      const { clientX, clientY } = getMouseCoordinates(e);
      if (selectedTool === Tools.SELECTION) {
        const selectedElement = getElementAtPosition(clientX, clientY);
        if (!selectedElement) return;
        if (selectedElement.position === "inside") setAction("moving");
        else setAction("resizing");
        if (selectedElement.tool === Tools.PENCIL) {
          if (!selectedElement.points) return;
          const offsetXArray = selectedElement.points.map((point) => {
            if (point[0] !== undefined) return clientX - point[0];
            else {
              return 0;
            }
          });
          const offsetYArray = selectedElement.points?.map((point) => {
            if (point[1] !== undefined) return clientY - point[1];
            else {
              return 0;
            }
          });
          setSelectedElement({
            ...selectedElement,
            offsetXArray,
            offsetYArray,
          });
        } else {
          const offsetX = clientX - selectedElement.x1;
          const offsetY = clientY - selectedElement.y1;
          setSelectedElement({ ...selectedElement, offsetX, offsetY });
        }
        setElements((prevState) => prevState);
      } else {
        setAction("drawing");
        const id = elements.length;
        const element = createElement(
          id,
          clientX,
          clientY,
          clientX,
          clientY,
          selectedTool
        );
        setElements((prev) => [...prev, element]);
        setSelectedElement({
          ...element,
          offsetX: 0,
          offsetY: 0,
          position: null,
        });
      }
    }
    console.log(e.button);
    if (e.button === 1) {
      setAction("panning");
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = getMouseCoordinates(e);
    if (action === "panning") {
      const deltaX = clientX + startPanMousePosition.x;
      const deltaY = clientY + startPanMousePosition.y;
      setPanOffset((prevState) => {
        return { x: prevState.x + deltaX, y: prevState.y + deltaY };
      });
    }

    if (selectedTool == Tools.SELECTION) {
      const element = getElementAtPosition(clientX, clientY);
      if (element?.position && selectedTool === Tools.SELECTION)
        (e.target as HTMLCanvasElement).style.cursor = element
          ? cursorForPosition(element.position)
          : "default";
      else (e.target as HTMLCanvasElement).style.cursor = "default";
    }
    if (action === "drawing") {
      const index = elements.length - 1;
      const element = elements[index];
      if (element) {
        const { x1, y1 } = element;
        updateEelement(index, x1, y1, clientX, clientY, selectedTool);
      }
    } else if (action === "moving" && selectedElement) {
      if (selectedElement.tool === Tools.PENCIL) {
        if (!selectedElement.points) return;
        const updatedPoints = selectedElement.points.map((point, index) => {
          if (
            !selectedElement.offsetXArray ||
            !selectedElement.offsetYArray ||
            selectedElement.offsetXArray[index] === undefined ||
            selectedElement.offsetYArray[index] === undefined
          ) {
            return [0, 0];
          }
          return [
            clientX - selectedElement.offsetXArray[index],
            clientY - selectedElement.offsetYArray[index],
          ];
        });
        const currentElements = elements.map((element) => ({ ...element }));
        if (!currentElements || !currentElements[selectedElement.id]) return;
        // @ts-ignore
        currentElements[selectedElement.id].points = updatedPoints;
        // console.log("Pencil Updated");
        // console.log("Old", elements);
        // console.log("new", currentElements);
        setElements(currentElements, true);
      } else {
        const { id, x1, y1, x2, y2, tool } = selectedElement;
        const { offsetX, offsetY } = selectedElement;
        const width = x2 - x1;
        const height = y2 - y1;
        const updatedX = offsetX ? clientX - offsetX : clientX;
        const updatedY = offsetY ? clientY - offsetY : clientY;
        updateEelement(
          id,
          updatedX,
          updatedY,
          updatedX + width,
          updatedY + height,
          tool
        );
      }
    } else if (action === "resizing" && selectedElement) {
      const { id, tool, position, ...coordinates } = selectedElement;
      const { x1, x2, y1, y2 } = resizedCoordinates(
        clientX,
        clientY,
        position,
        coordinates
      );
      updateEelement(id, x1, y1, x2, y2, tool);
    }
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button == 0) {
      if (
        (action === "drawing" || action === "resizing") &&
        selectedElement &&
        selectedTool !== Tools.PENCIL
      ) {
        const index = selectedElement.id;
        if (!elements[index]) return;
        const { id, tool } = elements[index];
        const { x1, y1, x2, y2 } = standardiseElementCoordinates(
          elements[index]
        );
        updateEelement(id, x1, y1, x2, y2, tool);
      }
      setAction("none");
      setSelectedElement(undefined);
      //TODO: Update Last Element to the DB, socket instance
    }
  };
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className=" absolute"
      ></canvas>
      <div className="fixed bottom-3 w-full ">
        <div className="flex items-center justify-center gap-4 ">
          <Button onClick={() => setSelectedTool(Tools.SELECTION)}>
            Selection
          </Button>
          <Button onClick={() => setSelectedTool(Tools.RECTANGLE)}>
            Rectangle
          </Button>
          <Button onClick={() => setSelectedTool(Tools.CIRCLE)}>Circle</Button>
          <Button onClick={() => setSelectedTool(Tools.LINE)}>Line</Button>
          <Button onClick={() => setSelectedTool(Tools.PENCIL)}>Pencil</Button>
          <Button onClick={() => Undo()}>Undo</Button>
          <Button onClick={() => Redo()}>Redo</Button>
          <Button onClick={() => ClearCanvas()}>Clear</Button>
          <ModeToggle def />
        </div>
      </div>
    </div>
  );
}
