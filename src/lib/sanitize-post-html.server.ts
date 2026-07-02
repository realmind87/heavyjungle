import "server-only";

import DOMPurify, { type UponSanitizeAttributeHookEvent } from "isomorphic-dompurify";
import {
  isAllowedPostImageSrc,
  isAllowedPostVideoSrc,
  isAllowedYoutubeEmbedSrc,
} from "@/lib/storage-url";

const ALLOWED_TAGS = [
  "p",
  "div",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "del",
  "strike",
  "a",
  "span",
  "font",
  "img",
  "video",
  "source",
  "iframe",
];
const ALLOWED_ATTR = [
  "style",
  "href",
  "target",
  "rel",
  "src",
  "alt",
  "loading",
  "decoding",
  "controls",
  "playsinline",
  "preload",
  "poster",
  "allow",
  "allowfullscreen",
  "frameborder",
  "title",
];

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "font-size",
  "font-weight",
  "font-style",
  "text-align",
  "display",
  "margin-left",
  "margin-right",
]);

const MEDIA_ONLY_STYLE_PROPS = new Set(["display", "margin-left", "margin-right"]);

function isAllowedHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isAllowedStyleValue(prop: string, val: string): boolean {
  const normalized = val.trim().toLowerCase();
  if (prop === "display") return normalized === "block";
  if (prop === "margin-left" || prop === "margin-right") {
    return normalized === "auto" || normalized === "0" || normalized === "0px";
  }
  return true;
}

function filterStyleValue(value: string, tagName: string): string {
  const upper = tagName.toUpperCase();
  const isMedia = upper === "IMG" || upper === "VIDEO";
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
      if (MEDIA_ONLY_STYLE_PROPS.has(prop) && !isMedia) return null;
      if (!isAllowedStyleValue(prop, val)) return null;
      if (/url\(|expression\(|javascript:/i.test(val)) return null;

      return `${prop}: ${val}`;
    })
    .filter((part): part is string => part !== null)
    .join("; ");
}

function postAttributeHook(node: Element, data: UponSanitizeAttributeHookEvent) {
  if (data.attrName === "href") {
    if (!isAllowedHref(data.attrValue)) {
      data.keepAttr = false;
    }
    return;
  }

  if (data.attrName === "style") {
    const filtered = filterStyleValue(data.attrValue, node.tagName);
    if (!filtered) {
      data.keepAttr = false;
      return;
    }
    data.attrValue = filtered;
    return;
  }

  if (data.attrName === "src") {
    const tag = node.tagName;
    if (tag === "IMG" && !isAllowedPostImageSrc(data.attrValue)) {
      data.keepAttr = false;
      return;
    }
    if ((tag === "VIDEO" || tag === "SOURCE") && !isAllowedPostVideoSrc(data.attrValue)) {
      data.keepAttr = false;
      return;
    }
    if (tag === "IFRAME" && !isAllowedYoutubeEmbedSrc(data.attrValue)) {
      data.keepAttr = false;
      return;
    }
  }

  if (node.tagName === "VIDEO" && data.attrName === "poster") {
    if (!isAllowedPostVideoSrc(data.attrValue)) {
      data.keepAttr = false;
      return;
    }
  }

  if (node.tagName === "IFRAME" && data.attrName === "allow") {
    data.attrValue = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  }
}

function postAfterSanitizeAttributesHook(node: Element) {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }

  if (node.tagName === "IMG") {
    node.setAttribute("loading", "lazy");
    node.setAttribute("decoding", "async");
  }

  if (node.tagName === "VIDEO") {
    node.setAttribute("controls", "");
    node.setAttribute("playsinline", "");
    node.setAttribute("preload", "metadata");
  }

  if (node.tagName === "IFRAME") {
    node.setAttribute("loading", "lazy");
    node.setAttribute("allowfullscreen", "");
    node.setAttribute("frameborder", "0");
  }
}

/** 에디터 HTML — XSS 방지 후 저장·렌더 */
export function sanitizePostHtml(html: string): string {
  DOMPurify.addHook("uponSanitizeAttribute", postAttributeHook);
  DOMPurify.addHook("afterSanitizeAttributes", postAfterSanitizeAttributesHook);

  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    }).trim();
  } finally {
    DOMPurify.removeHook("uponSanitizeAttribute", postAttributeHook);
    DOMPurify.removeHook("afterSanitizeAttributes", postAfterSanitizeAttributesHook);
  }
}
