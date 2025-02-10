import { WebSocketServer } from "ws";
import jwt, { decode, JwtPayload } from "jsonwebtoken";
import { JWT_SECRET, WS_PORT } from "@repo/backend-common/config";
const PORT = WS_PORT;
function validateUser(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded || typeof decoded == "string" || !decoded.userId) return null;
  return decoded.userId;
}
const wss = new WebSocketServer({ port: PORT });
wss.on("connection", function connection(ws, req) {
  const token = req.headers["authorization"] ?? "";
  const userId = validateUser(token);
  if (!userId) {
    ws.send("Invalid JWT");
    ws.close();
    return;
  }

  ws.on("message", function message(data) {
    ws.send("ping!");
  });
});
