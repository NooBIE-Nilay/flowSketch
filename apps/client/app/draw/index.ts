import { HTTP_URL } from "@/lib/config";
import axios from "axios";

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

async function getExistingShapes(roomId: string | number, token: string) {
  try {
    const res = await axios.get(`${HTTP_URL}/chats/${roomId}`, {
      headers: {
        Authorization: token,
      },
    });
    if (!res.data) return [];
    return res.data.map((msg: { message: string }) => JSON.parse(msg.message));
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function initDraw(
  canvas: HTMLCanvasElement,
  socket: WebSocket,
  roomId: string,
  token: string
) {
  const existingShapes: Shape[] = await getExistingShapes(roomId, token);
  const rectBtn = document.getElementById("rect");
  const circleBtn = document.getElementById("circle");
  const ctx = canvas.getContext("2d");
  let selected = "circle";

  let clicked = false;
  let startX = 0;
  let startY = 0;
  let radius = 0;

  reRenderCanvas(canvas, existingShapes);

  if (!ctx || !rectBtn || !circleBtn) return;

  socket.onmessage = (event) => {
    const parsedData = JSON.parse(event.data);
    if (parsedData.type === "chat") {
      const parsedShapes = JSON.parse(parsedData.message);
      existingShapes.push(parsedShapes);
      reRenderCanvas(canvas, existingShapes);
    }
  };

  rectBtn.addEventListener("click", () => (selected = "rect"));

  circleBtn.addEventListener("click", () => (selected = "circle"));

  canvas.addEventListener("mousemove", (e) => {
    if (clicked) {
      const width = e.clientX - startX;
      const height = e.clientY - startY;
      reRenderCanvas(canvas, existingShapes);
      ctx.strokeStyle = "#FFFFFF";
      if (selected === "rect") {
        ctx.strokeRect(startX, startY, width, height);
      } else {
        radius = Math.sqrt(width * width + height * height);
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button == 0) {
      startX = e.clientX;
      startY = e.clientY;
      clicked = true;
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    const width = e.clientX - startX;
    const height = e.clientY - startY;
    clicked = false;
    let shape: Shape;
    if (selected === "rect") {
      shape = {
        type: "rect",
        x: startX,
        y: startY,
        width,
        height,
      };
    } else {
      shape = {
        type: "circle",
        centerX: startX,
        centerY: startY,
        r: radius,
      };
    }
    existingShapes.push(shape);
    socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify(shape),
        roomId: Number(roomId),
      })
    );
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
    } else if (shape.type === "circle") {
      ctx.beginPath();
      ctx.arc(shape.centerX, shape.centerY, shape.r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  });
}
