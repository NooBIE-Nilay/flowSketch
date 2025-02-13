type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      r: number;
    };

export function initDraw(canvas: HTMLCanvasElement) {
  const existingShapes: Shape[] = [];
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let clicked = false;
  let startX = 0;
  let startY = 0;

  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      console.log("Current", e.clientX, e.clientY);
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      reRenderCanvas(canvas, existingShapes);
      ctx.strokeStyle = "#FFFFFF";
      ctx.strokeRect(startX, startY, width, height);
    }
  });
  canvas.addEventListener("mousedown", (e) => {
    clicked = true;
    startX = e.clientX;
    startY = e.clientY;
  });
  canvas.addEventListener("mouseup", (e) => {
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    clicked = false;
    console.log("Leave:", e.clientX, e.clientY);
    existingShapes.push({
      type: "rect",
      x: startX,
      y: startY,
      width,
      height,
    });
  });
}

function reRenderCanvas(canvas: HTMLCanvasElement, existingShapes: Shape[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  existingShapes.map((shape) => {
    ctx.strokeStyle = "#FFFFFF";
    if (shape.type === "rect") {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  });
}
