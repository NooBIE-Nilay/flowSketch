"use client";
import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";
//TODO: Use Hooks To Simplify The Logic,
//TODO: Use Redux to Fix this ugly state management
export default function CanvasConnectorRoom({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        })
      );
    };
  }, []);
  if (!socket) {
    return (
      <div>
        <h1>Connecting To The Server</h1>
      </div>
    );
  }
  return (
    <div>
      <Canvas roomId={roomId} socket={socket} token={token} />
    </div>
  );
}
