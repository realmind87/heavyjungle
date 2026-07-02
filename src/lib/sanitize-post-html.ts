import DOMPurify from "isomorphic-dompurify";

const RICH_POST_TAG_PATTERN = /<(img|video|iframe)\b/i;

export function hasPostImageMarkup(html: string): boolean {
  return RICH_POST_TAG_PATTERN.test(html);
}

export function isPostHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function isPostHtmlEmpty(html: string): boolean {
  const text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim();
  return text.length === 0 && !hasPostImageMarkup(html);
}
