import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { JWT_SECRET, WS_PORT } from "@repo/backend-common/config";
const PORT = WS_PORT;
import { prisma } from "@repo/db/client";

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}
const users: User[] = [];
function validateUser(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || typeof decoded == "string" || !decoded.userId) return null;
    return decoded.userId;
  } catch (e) {
    return null;
  }
}
const wss = new WebSocketServer({ port: PORT });
console.log("Server Running in PORT: ", PORT);
wss.on("connection", (ws, req) => {
  const url = req.url;
  if (!url) {
    ws.close();
    return;
  }
  const token = new URLSearchParams(url.split("?")[1]).get("token") || "";
  let userId = validateUser(token);
  if (!userId) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid JWT" }));
    ws.close();
    return;
  }
  users.push({
    userId,
    rooms: [],
    ws,
  });
  ws.on("message", async (data) => {
    try {
      const parsedData = JSON.parse(data.toString());
      if (parsedData.type === "join_room") {
        const user = users.find((x) => x.ws === ws);
        // TODO: Check in DB if room exists & then push
        // TODO: Later add access control so we can introduce private rooms
        user?.rooms.push(parsedData.roomId);
        console.log("Someone Joined Room ", parsedData.roomId);
      }
      if (parsedData.type === "leave_room") {
        const user = users.find((x) => x.ws === ws);
        if (user)
          user.rooms = user?.rooms.filter((x) => x === parsedData.roomId);
        console.log("Someone Left Room ", parsedData.roomId);
      }
      if (parsedData.type === "chat") {
        //TODO: Fix: a person not present in room1 can send meesages to room1
        const { roomId, message } = parsedData;
        const sender = users.find((x) => x.ws === ws);
        users.forEach((user) => {
          if (user.rooms.includes(`${roomId}`)) {
            user.ws.send(
              JSON.stringify({
                type: "chat",
                message,
                roomId,
                senderId: sender?.userId,
              })
            );
          }
        });
        try {
          await prisma.chat.create({
            data: {
              message,
              userId,
              roomId,
            },
          });
        } catch (e) {
          console.log(e);
        }
      }
      if (parsedData.type === "newElement") {
        const { element_data, roomId, userId, id } = parsedData;
        try {
          const res = await prisma.element.create({
            data: {
              element_data,
              creatorId: userId,
              roomId: roomId,
              modifiedAt: new Date(),
            },
          });
          const dbId = res.id;
          users.forEach((user) => {
            if (user.rooms.includes(roomId)) {
              user.ws.send(
                JSON.stringify({
                  id,
                  type: "newElement",
                  dbId,
                  element_data,
                  roomId,
                })
              );
            }
          });
        } catch (e) {
          console.log("DB Error:", e);
        }
      }
      if (parsedData.type === "updateElement") {
        const { element_data, roomId, dbId } = parsedData.data;
        users.forEach((user) => {
          if (user.rooms.includes(roomId)) {
            user.ws.send(
              JSON.stringify({
                dbId,
                type: "updateElement",
                element_data,
                roomId,
              })
            );
          }
        });
        try {
          await prisma.element.update({
            where: { id: dbId },
            data: {
              element_data,
            },
          });
        } catch (e) {
          console.log("DB Error:", e);
        }
      }
    } catch (e) {
      ws.send(JSON.stringify({ message: "Error Pasring Data" }));
      console.error("error parsing", e);
    }
  });
  ws.on("close", () => {
    const index = users.findIndex((user) => user.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });
});
