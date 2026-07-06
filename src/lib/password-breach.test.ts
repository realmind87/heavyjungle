import { createHash } from "node:crypto";
import { describe, expect, it, vi, afterEach } from "vitest";
import { BREACHED_PASSWORD_MESSAGE, isPasswordBreached } from "@/lib/password-breach";

describe("isPasswordBreached", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when HIBP range contains password suffix", async () => {
    const digest = createHash("sha1").update("password", "utf8").digest("hex").toUpperCase();
    const suffix = digest.slice(5);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => `${suffix}:123\n`,
      }),
    );

    const breached = await isPasswordBreached("password");
    expect(breached).toBe(true);
  });

  it("returns false when password suffix is not listed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "000000000000000000000000000000000:1\n",
      }),
    );

    const breached = await isPasswordBreached("unique-local-test-password-123");
    expect(breached).toBe(false);
  });

  it("fail-open when API errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const breached = await isPasswordBreached("password");
    expect(breached).toBe(false);
  });

  it("exposes user-facing message constant", () => {
    expect(BREACHED_PASSWORD_MESSAGE).toContain("유출");
  });
});
