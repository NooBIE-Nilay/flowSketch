import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";
import { JWT_SECRET } from "./config";
const app = express();
const PORT = Number(process.env.HTTP_PORT) || 3001;
app.get("/", (req, res) => {
  res.json({ msg: "Hello From HTTP Server" });
});
app.get("/signup", (req, res) => {
  //TODO: DB call here
  res.json({ userId: 123 });
});
app.get("/signin", (req, res) => {
  //TODO: Validate user is a valid user from DB!
  const token = jwt.sign({ id: 123 }, JWT_SECRET);
  res.json({ token });
});
app.get("/room", authMiddleware, (req, res) => {
  //TODO: DB call
  res.json({
    roomId: 23,
  });
});
app.listen(PORT, () =>
  console.log(`HTTP Server Runnning at http://localhost:${PORT}`)
);
