import { describe, expect, it } from "vitest";
import { sanitizePostHtml } from "@/lib/sanitize-post-html-core";

const PUBLIC_BASE = "http://localhost:9000/uploads";
const sanitize = (html: string) => sanitizePostHtml(html, PUBLIC_BASE);

/** 프롬프트 완료 기준 — 작성 → sanitize → 재조회 시나리오 통합 HTML */
const FIDELITY_FIXTURE = [
  '<div style="text-align: center">',
  '<span style="color: #e11d48; background-color: #fef3c7; font-size: 20px"><strong>제목</strong></span>',
  "</div>",
  "<div><br></div>",
  "<div>들여쓰기    공백</div>",
  "<ul><li>항목<ul><li>중첩</li></ul></li></ul>",
  '<table><tr><th colspan="2">표</th></tr><tr><td rowspan="2">A</td><td>B</td></tr></table>',
  '<div style="text-align: center"><img src="http://localhost:9000/uploads/posts/u/a.jpg" style="display: block; margin-left: auto; margin-right: auto; width: 200px" alt=""></div>',
  '<p><a href="https://example.com">링크</a></p>',
  "<blockquote>인용</blockquote>",
  "<pre><code>const ok = true;</code></pre>",
].join("");

describe("sanitizePostHtml round-trip fidelity", () => {
  it("preserves inline color, font-size, and bold", () => {
    const html =
      '<div style="text-align: center"><span style="color: #e11d48; font-size: 20px"><strong>Hello</strong></span></div>';
    const sanitized = sanitize(html);
    expect(sanitized).toContain('style="text-align: center"');
    expect(sanitized).toContain("color: #e11d48");
    expect(sanitized).toContain("font-size: 20px");
    expect(sanitized).toContain("<strong>Hello</strong>");
  });

  it("preserves background color and links", () => {
    const html =
      '<span style="background-color: #fef3c7; color: #111827">highlight</span> <a href="https://example.com">link</a>';
    const sanitized = sanitize(html);
    expect(sanitized).toContain("background-color: #fef3c7");
    expect(sanitized).toContain('href="https://example.com"');
    expect(sanitized).toContain("target=\"_blank\"");
  });

  it("preserves line breaks, nbsp, and consecutive spaces", () => {
    const html =
      "<div>line one</div><div><br></div><div>line three</div><div>indent    spaces</div><div>non&nbsp;breaking</div>";
    const sanitized = sanitize(html);
    expect(sanitized).toContain("line one");
    expect(sanitized).toContain("<br");
    expect(sanitized).toContain("line three");
    expect(sanitized).toContain("indent    spaces");
    expect(sanitized).toMatch(/non(\s|&nbsp;)breaking/);
  });

  it("preserves nested lists", () => {
    const html = "<ul><li>one<ul><li>nested</li></ul></li><li>two</li></ul><ol><li>a</li><li>b</li></ol>";
    const sanitized = sanitize(html);
    expect(sanitized).toContain("<ul>");
    expect(sanitized).toContain("<ol>");
    expect(sanitized).toContain("nested");
  });

  it("preserves table structure and cell merge attributes", () => {
    const html =
      '<table><tr><th colspan="2">Head</th></tr><tr><td rowspan="2">A</td><td>B</td></tr></table>';
    const sanitized = sanitize(html);
    expect(sanitized).toContain("<table>");
    expect(sanitized).toContain('colspan="2"');
    expect(sanitized).toContain('rowspan="2"');
  });

  it("preserves blockquote and code blocks", () => {
    const html = "<blockquote>quote</blockquote><pre><code>const x = 1;</code></pre>";
    const sanitized = sanitize(html);
    expect(sanitized).toContain("<blockquote>quote</blockquote>");
    expect(sanitized).toContain("<pre><code>const x = 1;</code></pre>");
  });

  it("preserves centered image alignment and width", () => {
    const html =
      '<div style="text-align: center"><img src="http://localhost:9000/uploads/posts/user/abc.jpg" style="display: block; margin-left: auto; margin-right: auto; width: 240px" alt=""></div>';
    const sanitized = sanitize(html);
    expect(sanitized).toContain("text-align: center");
    expect(sanitized).toContain("margin-left: auto");
    expect(sanitized).toContain("margin-right: auto");
    expect(sanitized).toContain("width: 240px");
  });

  it("preserves combined fidelity fixture", () => {
    const sanitized = sanitize(FIDELITY_FIXTURE);
    expect(sanitized).toContain("background-color: #fef3c7");
    expect(sanitized).toContain("<ul>");
    expect(sanitized).toContain('colspan="2"');
    expect(sanitized).toContain('href="https://example.com"');
    expect(sanitized).toContain("<blockquote>인용</blockquote>");
    expect(sanitized).toContain("width: 200px");
  });

  it("preserves GIF image src", () => {
    const html =
      '<div style="text-align: center"><img src="http://localhost:9000/uploads/posts/user/anim.gif" alt="gif" style="width: 200px"></div>';
    const sanitized = sanitize(html);
    expect(sanitized).toContain("anim.gif");
    expect(sanitized).toContain('alt="gif"');
  });

  it("strips script tags and javascript URLs", () => {
    const html =
      '<div onclick="alert(1)">bad</div><a href="javascript:alert(1)">link</a><script>alert(1)</script><span style="color: url(javascript:alert(1))">x</span>';
    const sanitized = sanitize(html);
    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("javascript:");
    expect(sanitized).not.toContain("onclick");
  });
});
