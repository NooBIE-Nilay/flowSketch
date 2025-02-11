import express from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "./middleware";
import { JWT_SECRET, HTTP_PORT } from "@repo/backend-common/config";
import {
  CreateRoomSchema,
  GetChatsSchema,
  SigninSchema,
  SignupSchema,
} from "@repo/common/types";
import { prisma } from "@repo/db/client";
const app = express();
const PORT = HTTP_PORT;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ msg: "Hello From HTTP Server" });
});

app.post("/signup", async (req, res) => {
  const parsedBody = SignupSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ message: "Incorrect Inputs" });
    return;
  }
  //TODO: Hash Password Before Saving
  const user = parsedBody.data;
  //TODO: Combine Checking and Creating to a Single Req by checking for exception and Hnadling it better
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
  //TODO: Verify Hashed Password
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
  //TODO: Combine Checking and Creating to a Single Req by checking for exception and Hnadling it better
  const presentRoom = await prisma.room.findUnique({ where: room });
  if (presentRoom) {
    res.status(400).json({ message: "Room Slug Already Exists!" });
    return;
  }
  const createdRoom = await prisma.room.create({ data: room });
  if (!createdRoom) {
    res.status(500).json({ message: "Cannot create User" });
    return;
  }
  res.status(201).json({
    roomId: createdRoom.id,
  });
});
app.get("/chats/:roomId", authMiddleware, async (req, res) => {
  try {
    if (!req.params.roomId) {
      res.status(400).json({ message: "Invalid RoomID" });
      return;
    }
    const roomId = Number(req.params.roomId);
    //TODO: Verirfy if user is part of the Room Or Not!
    const chats = await prisma.chat.findMany({
      where: {
        roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 50,
    });
    if (!chats) {
      res.status(500).json({ message: "Caanot Get Data From DB" });
      return;
    }
    res.status(200).json(chats);
  } catch (e) {
    res.status(400).json({ message: "Invalid RoomID" });
    return;
  }
});

app.listen(PORT, () =>
  console.log(`HTTP Server Running at http://localhost:${PORT}`)
);
