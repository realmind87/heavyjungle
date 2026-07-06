import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cacheGet = vi.fn();
const cacheSet = vi.fn();

vi.mock("@/lib/cache", () => ({
  cacheGet: (...args: unknown[]) => cacheGet(...args),
  cacheSet: (...args: unknown[]) => cacheSet(...args),
  cacheKey: (...parts: (string | number)[]) => parts.join(":"),
}));

const mockEnv = vi.hoisted(() => ({
  GOOGLE_SAFE_BROWSING_API_KEY: undefined as string | undefined,
}));

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { checkUrlsSafe } from "@/server/safety/link-check";

const SAFE_URL = "https://example.com/safe";
const UNSAFE_URL = "https://testsafebrowsing.appspot.com/apiv4/ANY_PLATFORM/SOCIAL_ENGINEERING/URL/";

describe("checkUrlsSafe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.GOOGLE_SAFE_BROWSING_API_KEY = "test-api-key";
    cacheGet.mockResolvedValue(null);
    cacheSet.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockEnv.GOOGLE_SAFE_BROWSING_API_KEY = undefined;
  });

  it("returns empty when API key is not configured (fail-open)", async () => {
    mockEnv.GOOGLE_SAFE_BROWSING_API_KEY = undefined;
    const result = await checkUrlsSafe([UNSAFE_URL]);
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns unsafe URLs from Safe Browsing API", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          matches: [{ threat: { url: UNSAFE_URL } }],
        }),
        { status: 200 },
      ),
    );

    const result = await checkUrlsSafe([SAFE_URL, UNSAFE_URL]);
    expect(result).toEqual([UNSAFE_URL]);
    expect(cacheSet).toHaveBeenCalled();
  });

  it("uses Redis cache for known-safe URLs without calling API", async () => {
    cacheGet.mockResolvedValueOnce({ safe: true });

    const result = await checkUrlsSafe([SAFE_URL]);
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns cached unsafe URLs without calling API", async () => {
    cacheGet.mockResolvedValueOnce({ safe: false });

    const result = await checkUrlsSafe([UNSAFE_URL]);
    expect(result).toEqual([UNSAFE_URL]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fail-opens when API request fails", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("error", { status: 500 }));

    const result = await checkUrlsSafe([UNSAFE_URL]);
    expect(result).toEqual([]);
  });

  it("skips internal and storage URLs", async () => {
    const original = {
      APP_URL: process.env.APP_URL,
      S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
    };
    process.env.APP_URL = "https://heavyjungle.com";
    process.env.S3_PUBLIC_URL = "https://s3.heavyjungle.com/uploads";

    const result = await checkUrlsSafe([
      "https://heavyjungle.com/privacy",
      "https://s3.heavyjungle.com/uploads/posts/u/x.jpg",
    ]);

    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();

    process.env.APP_URL = original.APP_URL;
    process.env.S3_PUBLIC_URL = original.S3_PUBLIC_URL;
  });
});
