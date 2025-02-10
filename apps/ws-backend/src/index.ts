import { WebSocketServer } from "ws";
import jwt, { decode, JwtPayload } from "jsonwebtoken";
import { JWT_SECRET, WS_PORT } from "@repo/backend-common/config";
const PORT = WS_PORT;
const wss = new WebSocketServer({ port: PORT });
wss.on("connection", function connection(ws, req) {
  const token = req.headers["authorization"] ?? "";
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded || !(decoded as JwtPayload).userId) {
    ws.send("Invalid JWT");
    ws.close();
    return;
  }
  ws.on("message", function message(data) {
    ws.send("ping!");
  });
});
