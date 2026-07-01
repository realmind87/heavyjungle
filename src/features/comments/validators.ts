import { z } from "zod";

export const createCommentSchema = z.object({
  postId: z.uuid("유효한 글이 필요합니다."),
  parentId: z.uuid().optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
  content: z.string().min(1, "댓글을 입력하세요.").max(20000, "댓글은 20,000자 이하여야 합니다."),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const deleteCommentSchema = z.object({
  commentId: z.uuid("유효한 댓글이 필요합니다."),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
