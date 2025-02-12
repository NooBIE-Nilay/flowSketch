"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

export default function ChatRoomClient({
  messages,
  id,
}: {
  messages: { message: string }[];
  id: string;
}) {
  const [chats, setChats] = useState(messages);
  const [newMessage, setNewMessage] = useState("");
  const { socket, isLoading } = useSocket();
  useEffect(() => {
    if (socket && !isLoading) {
      socket.onmessage = (event) => {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === "chat" && parsedData.roomId === id) {
          setChats((c) => [...c, { message: parsedData.message }]);
        }
      };
    }
  }, [socket, isLoading]);
  useEffect(() => {
    if (socket && !isLoading) {
      socket.send(
        JSON.stringify({
          type: "join_room",
          roomId: id,
        })
      );
    }
  }, [socket, id]);
  return (
    <>
      {chats.map((chat, _index) => (
        <div key={"chat" + _index}>{chat.message}</div>
      ))}
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="new message"
      ></input>
      <button
        onClick={() => {
          if (
            !socket ||
            socket.readyState === socket.CLOSED ||
            socket.readyState === socket.CLOSING
          )
            window.alert("Socket Disconnected! Please Reconnect");
          socket?.send(
            JSON.stringify({
              type: "chat",
              roomId: Number(id),
              message: newMessage,
            })
          );
          setNewMessage("");
        }}
      >
        Send Message
      </button>
    </>
  );
}
