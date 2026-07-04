import { z } from "zod";

export const reportReasonSchema = z.enum(["spam", "abuse", "illegal", "other"]);
export type ReportReason = z.infer<typeof reportReasonSchema>;

export const reportPostSchema = z.object({
  postId: z.uuid("유효한 글이 필요합니다."),
  reason: reportReasonSchema,
  detail: z.string().max(500, "500자 이하로 입력해 주세요.").optional(),
});

export const reportCommentSchema = z.object({
  commentId: z.uuid("유효한 댓글이 필요합니다."),
  reason: reportReasonSchema,
  detail: z.string().max(500, "500자 이하로 입력해 주세요.").optional(),
});

export const resolveReportSchema = z.object({
  reportId: z.uuid(),
});
