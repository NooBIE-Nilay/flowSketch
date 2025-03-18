import { Button } from "@repo/ui/components/button";
import { useEffect, useRef, useState } from "react";
import rough from "roughjs";
import { Drawable } from "roughjs/bin/core";

const generator = rough.generator();

type element_type = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roughElement: Drawable;
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<element_type[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [selection, setSelection] = useState("");

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      const roughCanvas = rough.canvas(canvas);

      elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement));
    }
  }, [elements]);

  const createElement = (x1: number, y1: number, x2: number, y2: number) => {
    let roughElement = generator.line(0, 0, 0, 0);
    if (selection == "rectangle")
      roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1);
    else if (selection == "line") roughElement = generator.line(x1, y1, x2, y2);
    else if (selection == "circle")
      roughElement = generator.circle(
        x1,
        y1,
        Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      );
    return { x1, y1, x2, y2, roughElement };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    //To Check If it is RightClick / LeftClick
    if (e.button == 0) {
      setDrawing(true);
      const { clientX, clientY } = e;
      // Upon Clicking & Holding, we generate an element with x1=x2 and y1=y2, when dragging the pointer, we update the element to a new element with the updated coordinates
      const element = createElement(clientX, clientY, clientX, clientY);
      setElements((prev) => [...prev, element]);
    }
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const { clientX, clientY } = e;
    const index = elements.length - 1;
    const element = elements[index];
    if (element) {
      const { x1, y1 } = element;
      const updatedElement = createElement(x1, y1, clientX, clientY);
      const updatedElements = [...elements];
      updatedElements[index] = updatedElement;
      setElements(updatedElements);
    }
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button == 0) {
      setDrawing(false);
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
          <Button onClick={() => setSelection("rectangle")}>Rectangle</Button>
          <Button onClick={() => setSelection("circle")}>Circle</Button>
          <Button onClick={() => setSelection("line")}>Line</Button>
        </div>
      </div>
    </div>
  );
}
