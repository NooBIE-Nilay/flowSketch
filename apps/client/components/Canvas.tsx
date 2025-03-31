import { Button } from "@repo/ui/components/button";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import rough from "roughjs";
import { Tools, Actions } from "@/lib/enums";
import { selected_element_type, element_type } from "@/lib/types";
import { useHistory } from "@/hooks/usehistory";
import { useTheme } from "next-themes";
import { ModeToggle } from "./modeToggle";
import usePressedKeys from "@/hooks/usePressedKeys";
import {
  createElement,
  cursorForPosition,
  distance,
  getElementAtPosition,
  getTempId,
  renderElement,
  resizedCoordinates,
  standardiseElementCoordinates,
} from "@/lib/utils";
import { useDrawingElements } from "@/hooks/useDrawingElements";

const generator = rough.generator();

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
  const [isLoading, fetchedElements] = useDrawingElements(roomId);
  const [elements, setElements, Undo, Redo] =
    useHistory<element_type[]>(fetchedElements);
  const [selectedElement, setSelectedElement] =
    useState<selected_element_type>();
  const [action, setAction] = useState(Actions.NONE);
  const [selectedTool, setSelectedTool] = useState(Tools.SELECTION);
  const [startPanMousePosition, setStartPanMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });
  const pressedKeys = usePressedKeys();
  const messageHandler = (message: any) => {
    if (message.type === "newElement") {
      try {
        const newElement = JSON.parse(message.element_data);
        setElements((prevElements) => {
          const elementIndex = elements.findIndex(
            (element) => element.tempId === message.tempId
          );
          const updatedElements = [...prevElements];
          if (elementIndex == -1 || !updatedElements[elementIndex])
            return [...updatedElements, newElement];
          updatedElements[elementIndex] = {
            ...updatedElements[elementIndex],
            dbId: message.dbId,
          };
          return updatedElements;
        });
      } catch (e) {
        console.log("Message Handler", e);
      }
    }
  };

  useEffect(() => {
    const handleSocketMessage = (event: MessageEvent) => {
      try {
        const parsedMessage = JSON.parse(event.data.toString());
        messageHandler(parsedMessage);
      } catch (e) {
        console.log("Socket Error:", e);
      }
    };
    socket.onmessage = handleSocketMessage;
    return () => {
      socket.onmessage = null;
    };
  });

  // Rerendering Content
  useLayoutEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const roughCanvas = rough.canvas(canvas);
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(
        panOffset.x * scale - scaleOffset.x,
        panOffset.y * scale - scaleOffset.y
      );
      ctx.scale(scale, scale);
      elements.forEach((element) =>
        renderElement(roughCanvas, ctx, element, strokeColor)
      );
      ctx.restore();
    }
  }, [elements, strokeColor, panOffset, scale, action, scaleOffset]);

  //  Scrool Wheel Listener
  useEffect(() => {
    document.addEventListener("wheel", panOrZoomHandler);
    return () => document.removeEventListener("wheel", panOrZoomHandler);
  }, [pressedKeys]);

  // Undo Redo Keyboard Handlers
  useEffect(() => {
    const undoRedoKeystrokeHandler = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === "z" || event.key === "Z")
      ) {
        if (event.shiftKey) Redo();
        else Undo();
      }
    };
    document.addEventListener("keydown", undoRedoKeystrokeHandler);
    return () => {
      document.removeEventListener("keydown", undoRedoKeystrokeHandler);
    };
  }, [Undo, Redo]);

  // Clear Canvas and move offsets to 0
  const ClearCanvas = () => {
    setPanOffset({ x: 0, y: 0 });
    setScaleOffset({ x: 0, y: 0 });
    setScale(1);
    setElements([]);
  };

  // Scale Handler
  const onZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(prev + delta, 0.1), 20));
  };

  //Element Update
  const updateElement = (
    index: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tool: string
  ) => {
    const currentElements = elements.map((element) => ({ ...element }));
    const tempId = currentElements[index]?.tempId || "";
    switch (tool) {
      case Tools.RECTANGLE:
      case Tools.CIRCLE:
      case Tools.LINE:
        currentElements[index] = createElement(
          generator,
          index,
          x1,
          y1,
          x2,
          y2,
          tool,
          tempId
        );
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

  // Standard Mouse Coordinates based on offsets
  const getMouseCoordinates = (
    event: React.MouseEvent<HTMLCanvasElement> | WheelEvent
  ) => {
    const clientX =
      (event.clientX - panOffset.x * scale + scaleOffset.x) / scale;
    const clientY =
      (event.clientY - panOffset.y * scale + scaleOffset.y) / scale;
    return { clientX, clientY };
  };

  // Mouse Handlers
  const panOrZoomHandler = (event: WheelEvent) => {
    //TODO: Fix Zoom To Center at Mouse Pointer
    if (pressedKeys.has("Meta") || pressedKeys.has("Control")) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const scaledWidth = canvas.width * (scale + event.deltaY * -0.01);
      const scaledHeight = canvas.height * (scale + event.deltaY * -0.01);
      const scaleOffsetX = (scaledWidth - canvas.width) / 2;
      const scaleOffsetY = (scaledHeight - canvas.height) / 2;
      setScaleOffset({
        x: scaleOffsetX,
        y: scaleOffsetY,
      });
      onZoom(event.deltaY * -0.01);
    } else
      setPanOffset((prevState) => {
        return {
          x: prevState.x - event.deltaX,
          y: prevState.y - event.deltaY,
        };
      });
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = getMouseCoordinates(e);
    if (e.button == 1 || e.button == 4 || pressedKeys.has(" ")) {
      setAction(Actions.PAN);
      setStartPanMousePosition({ x: clientX, y: clientY });
      return;
    }
    //To Check If it is RightClick / LeftClick
    if (e.button === 0) {
      if (selectedTool === Tools.SELECTION) {
        const selectedElement = getElementAtPosition(
          clientX,
          clientY,
          elements
        );
        if (!selectedElement) return;
        if (selectedElement.position === "inside") setAction(Actions.MOVE);
        else setAction(Actions.RESIZE);
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
        setAction(Actions.DRAW);
        const id = elements.length;
        const element = createElement(
          generator,
          id,
          clientX,
          clientY,
          clientX,
          clientY,
          selectedTool,
          getTempId()
        );
        setElements((prev) => {
          if (!prev) return [element];
          return [...prev, element];
        });
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
    const { clientX, clientY } = getMouseCoordinates(e);
    if (action === Actions.PAN) {
      const deltaX = clientX - startPanMousePosition.x;
      const deltaY = clientY - startPanMousePosition.y;
      setPanOffset((prevState) => {
        return { x: prevState.x + deltaX, y: prevState.y + deltaY };
      });
    }
    if (pressedKeys.has(" ") || action === Actions.PAN)
      (e.target as HTMLCanvasElement).style.cursor = "grab";
    else (e.target as HTMLCanvasElement).style.cursor = "default";
    if (selectedTool == Tools.SELECTION) {
      const element = getElementAtPosition(clientX, clientY, elements);
      if (element?.position && selectedTool === Tools.SELECTION)
        (e.target as HTMLCanvasElement).style.cursor = element
          ? cursorForPosition(element.position)
          : "default";
      else (e.target as HTMLCanvasElement).style.cursor = "default";
    }
    if (action === Actions.DRAW) {
      const index = elements.length - 1;
      const element = elements[index];
      if (element) {
        const { x1, y1 } = element;
        updateElement(index, x1, y1, clientX, clientY, selectedTool);
      }
    } else if (action === Actions.MOVE && selectedElement) {
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
        setElements(currentElements, true);
      } else {
        const { id, x1, y1, x2, y2, tool } = selectedElement;
        const { offsetX, offsetY } = selectedElement;
        const width = x2 - x1;
        const height = y2 - y1;
        const updatedX = offsetX ? clientX - offsetX : clientX;
        const updatedY = offsetY ? clientY - offsetY : clientY;
        updateElement(
          id,
          updatedX,
          updatedY,
          updatedX + width,
          updatedY + height,
          tool
        );
      }
    } else if (action === Actions.RESIZE && selectedElement) {
      const { id, tool, position, ...coordinates } = selectedElement;
      const { x1, x2, y1, y2 } = resizedCoordinates(
        clientX,
        clientY,
        position,
        coordinates
      );
      updateElement(id, x1, y1, x2, y2, tool);
    }
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 4 || e.button === 1) {
      setAction(Actions.NONE);
    }
    if (e.button == 0) {
      if (
        (action === Actions.DRAW || action === Actions.RESIZE) &&
        selectedElement &&
        selectedTool !== Tools.PENCIL
      ) {
        const index = selectedElement.id;
        if (!elements[index]) return;
        const { id, tool } = elements[index];
        const { x1, y1, x2, y2 } = standardiseElementCoordinates(
          elements[index]
        );
        updateElement(id, x1, y1, x2, y2, tool);
      }
      setAction(Actions.NONE);
      setSelectedElement(undefined);
      //TODO: Update Last Element to the DB, socket instance
      if (elements.length >= 1) {
        socket.send(
          JSON.stringify({
            type: "newElement",
            element_data: JSON.stringify(elements[elements.length - 1]),
            userId: "9aced262-8100-4341-916b-e983649fbbe3",
            roomId,
            tempId: elements[elements.length - 1]?.tempId,
          })
        );
      }
    }
  };

  return (
    <div>
      {isLoading && (
        <>
          <h1>Loading</h1>
        </>
      )}
      {!isLoading && (
        <>
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
              <Button onClick={() => setSelectedTool(Tools.CIRCLE)}>
                Circle
              </Button>
              <Button onClick={() => setSelectedTool(Tools.LINE)}>Line</Button>
              <Button onClick={() => setSelectedTool(Tools.PENCIL)}>
                Pencil
              </Button>
              <Button onClick={() => Undo()}>Undo</Button>
              <Button onClick={() => Redo()}>Redo</Button>
              <Button onClick={() => onZoom(-0.1)}>-</Button>
              <Button
                onClick={() => {
                  setScale(1);
                  setScaleOffset({ x: 0, y: 0 });
                }}
              >
                {Math.round(scale * 100)}%
              </Button>
              <Button onClick={() => onZoom(+0.1)}>+</Button>
              <Button onClick={() => ClearCanvas()}>Clear</Button>
              <ModeToggle def />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
