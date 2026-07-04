import { describe, expect, it } from "vitest";
import {
  isAllowedStoragePublicSrc,
  isAllowedYoutubeEmbedSrc,
  isOwnedPostImageKey,
} from "@/lib/media-url-policy";

describe("media-url-policy", () => {
  it("isOwnedPostImageKey checks user prefix", () => {
    expect(isOwnedPostImageKey("posts/u1/a.jpg", "u1")).toBe(true);
    expect(isOwnedPostImageKey("posts/u2/a.jpg", "u1")).toBe(false);
  });

  it("isAllowedYoutubeEmbedSrc allows embed hosts only", () => {
    expect(isAllowedYoutubeEmbedSrc("https://www.youtube.com/embed/abc")).toBe(true);
    expect(isAllowedYoutubeEmbedSrc("https://www.youtube.com/watch?v=abc")).toBe(false);
    expect(isAllowedYoutubeEmbedSrc("http://www.youtube.com/embed/abc")).toBe(false);
  });

  it("isAllowedStoragePublicSrc matches S3 public base", () => {
    const base = "http://localhost:9000/uploads";
    expect(isAllowedStoragePublicSrc(`${base}/posts/u1/anim.gif`, base, "posts")).toBe(true);
    expect(isAllowedStoragePublicSrc(`${base}/comments/u1/anim.gif`, base, "comments")).toBe(true);
    expect(isAllowedStoragePublicSrc("https://evil.test/posts/u1/a.jpg", base, "posts")).toBe(false);
  });
});
