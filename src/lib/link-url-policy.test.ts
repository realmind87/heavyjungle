import { afterEach, describe, expect, it } from "vitest";
import {
  extractExternalLinks,
  extractLinks,
  getAnchorRel,
  isInternalSiteLink,
  isStoragePublicLink,
  shouldSkipLinkSafetyCheck,
} from "@/lib/link-url-policy";

describe("extractLinks", () => {
  it("extracts unique http(s) hrefs from sanitized HTML", () => {
    const html =
      '<p><a href="https://example.com/a">one</a> <a href="https://example.com/a">dup</a></p>' +
      '<a href="http://test.org/b">two</a>';
    expect(extractLinks(html)).toEqual(["https://example.com/a", "http://test.org/b"]);
  });

  it("ignores non-http hrefs and malformed attributes", () => {
    const html = '<a href="mailto:x@y.com">mail</a><a href="javascript:void(0)">bad</a>';
    expect(extractLinks(html)).toEqual([]);
  });

  it("returns empty array when no links", () => {
    expect(extractLinks("<p>plain text</p>")).toEqual([]);
  });
});

describe("extractExternalLinks", () => {
  const originalEnv = {
    APP_URL: process.env.APP_URL,
    S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("excludes internal and storage URLs", () => {
    process.env.APP_URL = "https://heavyjungle.com";
    process.env.S3_PUBLIC_URL = "https://s3.heavyjungle.com/uploads";

    const html =
      '<a href="https://heavyjungle.com/privacy">in</a>' +
      '<a href="https://s3.heavyjungle.com/uploads/posts/u/x.jpg">img</a>' +
      '<a href="https://example.com/out">out</a>';

    expect(extractExternalLinks(html)).toEqual(["https://example.com/out"]);
  });
});

describe("getAnchorRel", () => {
  const originalAppUrl = process.env.APP_URL;

  afterEach(() => {
    if (originalAppUrl === undefined) {
      delete process.env.APP_URL;
    } else {
      process.env.APP_URL = originalAppUrl;
    }
  });

  it("adds nofollow ugc for external links", () => {
    expect(getAnchorRel("https://example.com/page")).toBe("noopener noreferrer nofollow ugc");
  });

  it("omits nofollow for heavyjungle.com internal links", () => {
    expect(getAnchorRel("https://heavyjungle.com/notices")).toBe("noopener noreferrer");
    expect(getAnchorRel("https://www.heavyjungle.com/")).toBe("noopener noreferrer");
  });

  it("omits nofollow for APP_URL host", () => {
    process.env.APP_URL = "http://localhost:3000";
    expect(getAnchorRel("http://localhost:3000/login")).toBe("noopener noreferrer");
  });
});

describe("shouldSkipLinkSafetyCheck", () => {
  const originalEnv = {
    APP_URL: process.env.APP_URL,
    S3_PUBLIC_URL: process.env.S3_PUBLIC_URL,
    NEXT_PUBLIC_S3_PUBLIC_URL: process.env.NEXT_PUBLIC_S3_PUBLIC_URL,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("skips internal site and storage URLs", () => {
    process.env.APP_URL = "https://heavyjungle.com";
    process.env.S3_PUBLIC_URL = "https://s3.heavyjungle.com/uploads";

    expect(shouldSkipLinkSafetyCheck("https://heavyjungle.com/privacy")).toBe(true);
    expect(shouldSkipLinkSafetyCheck("https://s3.heavyjungle.com/uploads/posts/u/x.jpg")).toBe(
      true,
    );
    expect(shouldSkipLinkSafetyCheck("https://evil.example/phish")).toBe(false);
  });

  it("identifies internal site and storage links", () => {
    process.env.S3_PUBLIC_URL = "http://localhost:9000/uploads";
    expect(isInternalSiteLink("https://heavyjungle.com/")).toBe(true);
    expect(isStoragePublicLink("http://localhost:9000/uploads/posts/a/b.jpg")).toBe(true);
  });
});
