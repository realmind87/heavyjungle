import DOMPurify from "isomorphic-dompurify";

export function isCommentHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function isCommentHtmlEmpty(html: string): boolean {
  const text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim();
  const hasImage = /<img\b/i.test(html);
  return text.length === 0 && !hasImage;
}
