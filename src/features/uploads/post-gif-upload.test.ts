import { describe, expect, it } from "vitest";
import { resolveCommentImageContentType, resolvePostImageContentType } from "@/features/uploads/constants";
import { deleteCommentImageSchema, deletePostImageSchema, postImageUploadIntentSchema, commentImageUploadIntentSchema } from "@/features/uploads/validators";

describe("post gif upload", () => {
  it("accepts image/gif intent", () => {
    const parsed = postImageUploadIntentSchema.safeParse({
      filename: "anim.gif",
      contentType: "image/gif",
      size: 1024,
    });
    expect(parsed.success).toBe(true);
  });

  it("infers gif from filename when mime is missing", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "anim.gif", { type: "" });
    expect(resolvePostImageContentType(file)).toBe("image/gif");
  });

  it("allows deleting gif object keys", () => {
    const parsed = deletePostImageSchema.safeParse({
      key: "posts/550e8400-e29b-41d4-a716-446655440000/550e8400-e29b-41d4-a716-446655440001.gif",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("comment gif upload", () => {
  it("accepts image/gif intent", () => {
    const parsed = commentImageUploadIntentSchema.safeParse({
      filename: "anim.gif",
      contentType: "image/gif",
      size: 1024,
    });
    expect(parsed.success).toBe(true);
  });

  it("infers gif from filename when mime is missing", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "anim.gif", { type: "" });
    expect(resolveCommentImageContentType(file)).toBe("image/gif");
  });

  it("allows deleting gif object keys", () => {
    const parsed = deleteCommentImageSchema.safeParse({
      key: "comments/550e8400-e29b-41d4-a716-446655440000/550e8400-e29b-41d4-a716-446655440001.gif",
    });
    expect(parsed.success).toBe(true);
  });
});
