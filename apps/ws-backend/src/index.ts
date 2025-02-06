import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "./config";
const PORT = Number(process.env.WS_PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });
wss.on("connection", function connection(ws, req) {
  const token = req.headers["authorization"] ?? "";
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded || !(decoded as JwtPayload).userId) {
    ws.close();
    return;
  }
  ws.on("message", function message(data) {
    ws.send("ping!");
  });
});
