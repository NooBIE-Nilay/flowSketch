import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";
import { JWT_SECRET, HTTP_PORT } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  SigninSchema,
  SignupSchema,
} from "@repo/common/types";
const app = express();
const PORT = HTTP_PORT;

app.use(express.json()); // Ensure the app can parse JSON bodies

app.get("/", (req, res) => {
  res.json({ msg: "Hello From HTTP Server" });
});

app.post("/signup", (req, res) => {
  // Changed to POST for signup
  const data = SignupSchema.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ message: "Incorrect Inputs" });
    return;
  }
  //TODO: DB call here

  res.json({ userId: 123 });
});

app.post("/signin", (req, res) => {
  // Changed to POST for signin
  const data = SigninSchema.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ message: "Incorrect Inputs" });
    return;
  }
  //TODO: Validate user is a valid user from DB!
  const userId = 123;
  const token = jwt.sign({ userId }, JWT_SECRET);
  res.json({ userId, token });
});

app.post("/room", authMiddleware, (req, res) => {
  // Changed to POST for room creation
  const data = CreateRoomSchema.safeParse(req.body);
  if (!data.success) {
    res.status(400).json({ message: "Incorrect Inputs" });
    return;
  }
  //TODO: DB call
  res.json({
    roomId: 23,
  });
});

app.listen(PORT, () =>
  console.log(`HTTP Server Running at http://localhost:${PORT}`)
);
