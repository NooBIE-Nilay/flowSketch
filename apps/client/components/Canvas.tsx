import { Button } from "@repo/ui/components/button";
import { act, useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";
import { Tools } from "@/lib/config";
const generator = rough.generator();

// TODO: Refactor Code
type element_type = {
  tool: string;
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roughElement: Drawable;
};
interface selected_element_type extends element_type {
  offsetX: number;
  offsetY: number;
  position: string | null;
}

export default function Canvas({
  socket,
  roomId,
  token,
}: {
  socket: WebSocket;
  roomId: string;
  token: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<element_type[]>([]);
  const [selectedElement, setSelectedElement] =
    useState<selected_element_type>();
  const [action, setAction] = useState("none");
  const [selectedTool, setSelectedTool] = useState(Tools.SELECTION);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      const roughCanvas = rough.canvas(canvas);

      elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
    }
  }, [elements]);

  const createElement = (
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tool: string
  ) => {
    let roughElement = generator.line(0, 0, 0, 0); //TODO: Fix This HACK: {To Trick TS-Compiler}
    if (tool == Tools.RECTANGLE)
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    else if (tool == Tools.LINE) roughElement = generator.line(x1, y1, x2, y2);
    else if (tool == Tools.CIRCLE)
      roughElement = generator.circle(
        x1,
        y1,
        2 * distance({ x: x1, y: y1 }, { x: x2, y: y2 })
      );
    return { id, x1, y1, x2, y2, roughElement, tool };
  };

  const getElementAtPosition = (x: number, y: number) => {
    return elements
      .map((element) => ({
        ...element,
        position: getPositionWithinElement(x, y, element),
      }))
      .find((element) => element.position !== null);
  };

  const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

  const nearPoint = (
    x: number,
    y: number,
    x1: number,
    y1: number,
    name: string
  ) => {
    return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
  };

  const getPositionWithinElement = (
    x: number,
    y: number,
    element: element_type
  ) => {
    const { x1, y1, x2, y2 } = element;
    if (element.roughElement.shape === "line") {
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x, y };
      const offset = distance(a, b) - (distance(a, c) + distance(b, c));
      const inside = Math.abs(offset) < 1 ? "inside" : null;
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      return start || end || inside;
    } else if (element.roughElement.shape === "rectangle") {
      const topLeft = nearPoint(x, y, x1, y1, "tl");
      const topRight = nearPoint(x, y, x2, y1, "tr");
      const bottomLeft = nearPoint(x, y, x1, y2, "bl");
      const bottomRight = nearPoint(x, y, x2, y2, "br");
      const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
      return topLeft || topRight || bottomLeft || bottomRight || inside;
    } else if (element.roughElement.shape === "circle") {
      const radius = distance({ x: x1, y: y1 }, { x: x2, y: y2 });
      const a = { x: x1, y: y1 };
      const c = { x, y };
      const inside = distance(a, c) <= radius ? "inside" : null;
      const nearCircumferance =
        Math.abs(distance(a, c) - radius) <= 5 ? "near" : null;
      return nearCircumferance || inside;
    }
    return null;
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
  const updateEelement = (
    index: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: string
  ) => {
    const updatedElement = createElement(index, x1, y1, x2, y2, type);
    const updatedElements = [...elements];
    updatedElements[index] = updatedElement;
    setElements(updatedElements);
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
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    //To Check If it is RightClick / LeftClick
    if (e.button == 0) {
      const { clientX, clientY } = e;
      if (selectedTool === Tools.SELECTION) {
        const selectedElement = getElementAtPosition(clientX, clientY);
        if (!selectedElement) return;
        if (selectedElement.position === "inside") setAction("moving");
        else setAction("resizing");
        const offsetX = clientX - selectedElement.x1;
        const offsetY = clientY - selectedElement.y1;

        setSelectedElement({ ...selectedElement, offsetX, offsetY });
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
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = e;
    if (selectedTool == Tools.SELECTION) {
      const element = getElementAtPosition(clientX, clientY);
      (e.target as HTMLCanvasElement).style.cursor = element
        ? cursorForPosition(element.position)
        : "default";
    }
    if (action === "drawing") {
      const index = elements.length - 1;
      const element = elements[index];
      if (element) {
        const { x1, y1 } = element;
        updateEelement(index, x1, y1, clientX, clientY, selectedTool);
      }
    } else if (action === "moving" && selectedElement) {
      const { id, x1, y1, x2, y2, offsetX, offsetY, tool } = selectedElement;
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
      if ((action === "drawing" || action === "resizing") && selectedElement) {
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
      ></canvas>
      <div className="fixed bottom-3 w-full ">
        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => setSelectedTool(Tools.SELECTION)}>
            Selection
          </Button>
          <Button onClick={() => setSelectedTool(Tools.RECTANGLE)}>
            Rectangle
          </Button>
          <Button onClick={() => setSelectedTool(Tools.CIRCLE)}>Circle</Button>
          <Button onClick={() => setSelectedTool(Tools.LINE)}>Line</Button>
        </div>
      </div>
    </div>
  );
}
