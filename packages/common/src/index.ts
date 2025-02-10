import { z } from "zod";
export const SigninSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export const SignupSchema = z.object({
  name: z.string(),
  username: z.string(),
  password: z.string(),
});
export const CreateRoomSchema = z.object({
  name: z.string(),
});
