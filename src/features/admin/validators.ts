import { z } from "zod";

export const adminDeletePostSchema = z.object({
  postId: z.string().uuid(),
});

export const adminDeleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

export const setUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin"]),
});
