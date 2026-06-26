import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = ["p", "div", "br", "strong", "b", "em", "i", "span", "font"];
const ALLOWED_ATTR = ["style"];

/** 에디터 HTML — XSS 방지 후 저장·렌더 */
export function sanitizePostHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_CSS_PROPERTIES: ["color", "font-size", "font-weight", "font-style", "text-align"],
  }).trim();
}

export function isPostHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function isPostHtmlEmpty(html: string): boolean {
  const text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim();
  return text.length === 0;
}
