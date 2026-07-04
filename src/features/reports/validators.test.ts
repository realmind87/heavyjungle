import { describe, expect, it } from "vitest";
import { reportCommentSchema, reportPostSchema } from "@/features/reports/validators";

const postId = "550e8400-e29b-41d4-a716-446655440000";
const commentId = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("report validators", () => {
  it("reportPostSchema accepts valid input", () => {
    const parsed = reportPostSchema.safeParse({ postId, reason: "spam" });
    expect(parsed.success).toBe(true);
  });

  it("reportPostSchema rejects invalid uuid", () => {
    const parsed = reportPostSchema.safeParse({ postId: "bad", reason: "spam" });
    expect(parsed.success).toBe(false);
  });

  it("reportCommentSchema rejects long detail", () => {
    const parsed = reportCommentSchema.safeParse({
      commentId,
      reason: "abuse",
      detail: "x".repeat(501),
    });
    expect(parsed.success).toBe(false);
  });
});
