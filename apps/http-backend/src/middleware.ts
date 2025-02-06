import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  //TODO: Validate JWT is valid!
  const token = req.headers.authorization ?? "";
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded) {
    //TODO: Google How to change global structure of express req and fix it
    //@ts-ignore
    req.userId = decoded.userId;
    next();
  } else {
    res.status(403).json({ message: "Unauthorized" });
  }
}
