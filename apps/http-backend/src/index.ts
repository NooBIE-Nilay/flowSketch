import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";
import { JWT_SECRET, HTTP_PORT } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  SigninSchema,
  SignupSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db/client";
const app = express();
const PORT = HTTP_PORT;

app.use(express.json()); // Ensure the app can parse JSON bodies

app.get("/", (req, res) => {
  res.json({ msg: "Hello From HTTP Server" });
});

app.post("/signup", async (req, res) => {
  const parsedBody = SignupSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: "Incorrect Inputs" });
    return;
  }
  const user = {
    ...parsedBody.data,
    avatar:
      parsedBody.data.avatar ||
      "https://www.freepik.com/free-vector/young-man-orange-hoodie_336636034.htm#fromView=keyword&page=1&position=6&uuid=bdcfb413-bc08-4d9d-b902-e4b26c43456f&query=Avatar",
  };
  const userInDb = await prisma.user.findFirst({
    where: { email: parsedBody.data.email },
  });
  if (userInDb) {
    res.status(400).json({ message: "User Already Present!" });
    return;
  }
  const createdUser = await prisma.user.create({
    data: user,
  });
  if (!createdUser) {
    res.status(500).json({ message: "Failed To Create User" });
    return;
  }
  const token = jwt.sign({ userId: createdUser.id }, JWT_SECRET);
  res.status(201).json({ token });
});

app.get("/signin", async (req, res) => {
  const parsedBody = SigninSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: "Incorrect Inputs" });
    return;
  }
  const user = parsedBody.data;
  const validatedUser = await prisma.user.findFirst({
    where: { ...user },
  });
  if (!validatedUser) {
    res.status(401).json({
      messsage: "Invalid Username/Password",
    });
    return;
  }
  const token = jwt.sign({ userId: validatedUser.id }, JWT_SECRET);
  res.status(201).json({ token });
});

app.post("/room", authMiddleware, async (req, res) => {
  const parsedBody = CreateRoomSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: "Incorrect Inputs" });
    return;
  }
  const room = {
    slug: parsedBody.data.slug,
    //@ts-ignore
    adminId: req.userId,
  };
  const createdRoom = await prisma.room.create({ data: room });
  if (!createdRoom) {
    res.status(500).json({ message: "Cannot create User" });
    return;
  }
  res.status(201).json({
    roomId: createdRoom.id,
  });
});

app.listen(PORT, () =>
  console.log(`HTTP Server Running at http://localhost:${PORT}`)
);
