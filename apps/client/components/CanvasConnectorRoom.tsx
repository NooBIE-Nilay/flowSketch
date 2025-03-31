"use client";
import { HTTP_URL, WS_URL } from "@/lib/config";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";
import axios from "axios";
import { CreateRoomSchema } from "@repo/common/types";
import { error } from "console";
//TODO: Use Hooks To Simplify The Logic,
//TODO: Use Redux to Fix this ugly state management
export default function CanvasConnectorRoom({ slug }: { slug: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [roomId, setRoomId] = useState();
  useEffect(() => {
    if (localStorage) {
      const fetchRoomId = async () => {
        try {
          const roomIdRes = await axios.get(`${HTTP_URL}/room/${slug}`, {
            headers: {
              Authorization: localStorage.getItem("token"),
            },
          });
          if (roomIdRes.data.id) {
            setRoomId(roomIdRes.data.id);
          } else {
            const body = CreateRoomSchema.safeParse({ slug });
            const createRes = await axios.post(
              `${HTTP_URL}/room`,
              {
                ...body,
              },
              {
                headers: {
                  Authorization: localStorage.getItem("token"),
                },
              }
            );
            if (createRes.data.roomId) {
              setRoomId(createRes.data.roomId);
            }
          }
        } catch (e) {
          console.log({ msg: "Cannot Fetch RoomID from Slug", error: e });
          setIsError(true);
          setErrorMessage("Cannot Fetch RoomID from Slug");
        }
      };

      fetchRoomId();
    } else {
      setIsError(true);
      setErrorMessage("Undefined Local Storage");
    }
  }, []);
  useEffect(() => {
    if (!roomId) return;
    const ws = new WebSocket(
      `${WS_URL}?token=${localStorage.getItem("token")}`
    );
    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        })
      );
    };
    return () => ws.close();
  }, [roomId]);
  if (!roomId) return <>Invalid RoomID</>;
  if (isError) return <>{errorMessage}</>;
  if (!socket) {
    return (
      <>
        <h1>Connecting To The Server</h1>
      </>
    );
  }
  return (
    <div>
      <Canvas
        roomId={roomId}
        socket={socket}
        token={localStorage.getItem("token") || ""}
      />
    </div>
  );
}
