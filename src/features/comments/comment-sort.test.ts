import { describe, expect, it } from "vitest";
import { compareComments } from "@/features/comments/comment-sort";

describe("compareComments", () => {
  const older = { id: "a", likeCount: 1, createdAt: new Date("2026-01-01T00:00:00.000Z") };
  const newer = { id: "b", likeCount: 1, createdAt: new Date("2026-01-02T00:00:00.000Z") };

  it("sorts latest first", () => {
    expect(compareComments(newer, older, "latest")).toBeLessThan(0);
  });

  it("sorts oldest first", () => {
    expect(compareComments(newer, older, "oldest")).toBeGreaterThan(0);
  });

  it("sorts popular by like count", () => {
    const popular = { id: "c", likeCount: 10, createdAt: older.createdAt };
    expect(compareComments(popular, older, "popular")).toBeLessThan(0);
  });
});
