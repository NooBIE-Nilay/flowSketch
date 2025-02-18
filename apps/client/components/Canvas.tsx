import { initDraw } from "@/app/draw";
import { Button } from "@repo/ui/components/button";
import { useEffect, useRef } from "react";

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
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      initDraw(canvas, socket, roomId, token);
    }
  }, [canvasRef]);
  return (
    <div>
      <canvas ref={canvasRef} width={2000} height={1000}></canvas>
      <div className="fixed bottom-3 w-full ">
        <div className="flex items-center justify-center gap-4">
          <Button id="rect">Rectangle</Button>
          <Button id="circle">Circle</Button>
        </div>
      </div>
    </div>
  );
}
