import DOMPurify from "isomorphic-dompurify";

/** contentEditable가 삽입하는 nbsp → 일반 공백 */
export function stripCommentNbsp(value: string): string {
  return value.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ");
}

const RICH_COMMENT_TAG_PATTERN = /<(?:a|img)\b/i;

export function hasRichCommentMarkup(html: string): boolean {
  return RICH_COMMENT_TAG_PATTERN.test(html);
}

/** div/br 래퍼만 있는 댓글은 plain text로 추출 */
export function extractPlainCommentText(html: string): string {
  const cleaned = stripCommentNbsp(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>\s*<div[^>]*>/gi, "\n")
    .replace(/<div[^>]*>/gi, "")
    .replace(/<\/div>/gi, "\n");

  return DOMPurify.sanitize(cleaned, { ALLOWED_TAGS: [] })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** 저장 전 입력 정규화 — 링크·이미지 없으면 plain text */
export function normalizeCommentInput(html: string): string {
  const cleaned = stripCommentNbsp(html);
  if (!hasRichCommentMarkup(cleaned)) {
    return extractPlainCommentText(cleaned);
  }
  return cleaned;
}

export function isCommentHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function isCommentHtmlEmpty(html: string): boolean {
  const normalized = normalizeCommentInput(html);
  const text = hasRichCommentMarkup(normalized)
    ? stripCommentNbsp(DOMPurify.sanitize(normalized, { ALLOWED_TAGS: [] })).trim()
    : normalized.trim();
  const hasImage = /<img\b/i.test(html);
  return text.length === 0 && !hasImage;
}
