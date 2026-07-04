import { describe, expect, it } from "vitest";
import { firstImageFromHtml, plainTextFromHtml } from "@/lib/metadata";

describe("metadata helpers", () => {
  it("plainTextFromHtml strips tags and truncates", () => {
    const html = "<p>Hello <strong>world</strong>&nbsp;!</p>";
    expect(plainTextFromHtml(html)).toBe("Hello world !");
    expect(plainTextFromHtml("x".repeat(200), 50)).toHaveLength(50);
  });

  it("firstImageFromHtml extracts first src", () => {
    const html = '<p>text</p><img src="https://cdn/a.jpg" alt="" />';
    expect(firstImageFromHtml(html)).toBe("https://cdn/a.jpg");
    expect(firstImageFromHtml("<p>no image</p>")).toBeNull();
  });
});
