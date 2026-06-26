import DOMPurify, { type UponSanitizeAttributeHookEvent } from "isomorphic-dompurify";

const ALLOWED_TAGS = ["p", "div", "br", "strong", "b", "em", "i", "span", "font"];
const ALLOWED_ATTR = ["style"];

const ALLOWED_STYLE_PROPS = new Set(["color", "font-size", "font-weight", "font-style", "text-align"]);

function filterStyleValue(value: string): string {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colonIndex = part.indexOf(":");
      if (colonIndex === -1) return null;

      const prop = part.slice(0, colonIndex).trim().toLowerCase();
      const val = part.slice(colonIndex + 1).trim();

      if (!ALLOWED_STYLE_PROPS.has(prop)) return null;
      if (/url\(|expression\(|javascript:/i.test(val)) return null;

      return `${prop}: ${val}`;
    })
    .filter((part): part is string => part !== null)
    .join("; ");
}

function styleAttributeHook(_node: Element, data: UponSanitizeAttributeHookEvent) {
  if (data.attrName !== "style") return;

  const filtered = filterStyleValue(data.attrValue);
  if (!filtered) {
    data.keepAttr = false;
    return;
  }

  data.attrValue = filtered;
}

/** 에디터 HTML — XSS 방지 후 저장·렌더 */
export function sanitizePostHtml(html: string): string {
  DOMPurify.addHook("uponSanitizeAttribute", styleAttributeHook);

  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    }).trim();
  } finally {
    DOMPurify.removeHook("uponSanitizeAttribute", styleAttributeHook);
  }
}

export function isPostHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function isPostHtmlEmpty(html: string): boolean {
  const text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim();
  return text.length === 0;
}
