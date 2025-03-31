import { useEffect, useState } from "react";
export const useWebSocket = (socket: WebSocket) => {
  const [messages, setMessages] = useState<any[]>([]);
  useEffect(() => {
    if (!socket) return;
    const handleSocketMessages = (event: MessageEvent) => {
      try {
        const parsedMessage = JSON.parse(event.data.toString());
        setMessages((prev) => [...prev, parsedMessage]);
      } catch (e) {
        console.log(e);
      }
    };
    socket.onmessage = handleSocketMessages;
    return () => {
      socket.onmessage = null;
    };
  }, [socket]);
  return messages;
};
