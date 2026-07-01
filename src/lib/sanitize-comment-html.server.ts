import "server-only";

import DOMPurify, { type UponSanitizeAttributeHookEvent } from "isomorphic-dompurify";
import { hasRichCommentMarkup, normalizeCommentInput, stripCommentNbsp } from "@/lib/sanitize-comment-html";
import { isAllowedCommentImageSrc } from "@/lib/storage-url";

const ALLOWED_TAGS = ["p", "div", "br", "strong", "b", "em", "i", "a", "img"];
const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "loading", "decoding"];

function isAllowedHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function commentAttributeHook(_node: Element, data: UponSanitizeAttributeHookEvent) {
  if (data.attrName === "href") {
    if (!isAllowedHref(data.attrValue)) {
      data.keepAttr = false;
    }
    return;
  }

  if (data.attrName === "src" && !isAllowedCommentImageSrc(data.attrValue)) {
    data.keepAttr = false;
  }
}

function commentAfterSanitizeAttributesHook(node: Element) {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }

  if (node.tagName === "IMG") {
    node.setAttribute("loading", "lazy");
    node.setAttribute("decoding", "async");
  }
}

/** 댓글 HTML — XSS 방지 후 저장 */
export function sanitizeCommentHtml(html: string): string {
  const normalized = normalizeCommentInput(html);
  if (!hasRichCommentMarkup(normalized)) {
    return normalized;
  }

  const cleaned = stripCommentNbsp(normalized);

  DOMPurify.addHook("uponSanitizeAttribute", commentAttributeHook);
  DOMPurify.addHook("afterSanitizeAttributes", commentAfterSanitizeAttributesHook);

  try {
    return DOMPurify.sanitize(cleaned, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    }).trim();
  } finally {
    DOMPurify.removeHook("uponSanitizeAttribute", commentAttributeHook);
    DOMPurify.removeHook("afterSanitizeAttributes", commentAfterSanitizeAttributesHook);
  }
}
