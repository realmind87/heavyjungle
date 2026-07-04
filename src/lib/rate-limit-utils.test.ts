import { describe, expect, it } from "vitest";
import { hashRateLimitId, rateLimitErrorMessage } from "@/lib/rate-limit-utils";

describe("rate-limit-utils", () => {
  it("hashRateLimitId is stable and case-insensitive", () => {
    const a = hashRateLimitId("User@Example.com");
    const b = hashRateLimitId("  user@example.com  ");
    expect(a).toBe(b);
    expect(a).toHaveLength(32);
  });

  it("rateLimitErrorMessage formats seconds and minutes", () => {
    expect(rateLimitErrorMessage(30)).toContain("30초");
    expect(rateLimitErrorMessage(90)).toContain("2분");
  });
});
