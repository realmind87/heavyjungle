import DOMPurify, { type UponSanitizeAttributeHookEvent } from "isomorphic-dompurify";
import { getAnchorRel } from "@/lib/link-url-policy";
import {
  isAllowedStoragePublicSrc,
  isAllowedYoutubeEmbedSrc as isAllowedYoutubeEmbedSrcCore,
} from "@/lib/media-url-policy";

function resolvePublicBaseUrl(override?: string): string {
  if (override) return override;
  return process.env.S3_PUBLIC_URL ?? process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? "";
}

function createPostSanitizeHooks(publicBaseUrl: string) {
  function isAllowedPostImageSrc(src: string): boolean {
    return isAllowedStoragePublicSrc(src, publicBaseUrl, "posts");
  }

  function isAllowedPostVideoSrc(src: string): boolean {
    return isAllowedStoragePublicSrc(src, publicBaseUrl, "posts");
  }

  function isAllowedYoutubeEmbedSrc(src: string): boolean {
    return isAllowedYoutubeEmbedSrcCore(src);
  }

  function postAttributeHook(node: Element, data: UponSanitizeAttributeHookEvent) {
    if (data.attrName === "href") {
      if (!isAllowedHref(data.attrValue)) {
        data.keepAttr = false;
      }
      return;
    }

    if (data.attrName === "colspan" || data.attrName === "rowspan") {
      if (!isAllowedColSpan(data.attrValue)) {
        data.keepAttr = false;
      }
      return;
    }

    if (data.attrName === "color" && node.tagName !== "FONT") {
      data.keepAttr = false;
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
      data.attrValue =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    }
  }

  function postAfterSanitizeAttributesHook(node: Element) {
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", getAnchorRel(href));
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

  return { postAttributeHook, postAfterSanitizeAttributesHook };
}

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
  "u",
  "a",
  "span",
  "font",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "th",
  "td",
  "caption",
  "blockquote",
  "pre",
  "code",
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
  "color",
  "colspan",
  "rowspan",
  "start",
  "type",
];

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-size",
  "font-weight",
  "font-style",
  "text-align",
  "text-decoration",
  "white-space",
  "padding-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "display",
  "margin-left",
  "margin-right",
  "width",
  "height",
  "max-width",
  "max-height",
  "vertical-align",
  "border",
  "border-collapse",
  "border-width",
  "border-style",
  "border-color",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
]);

const MEDIA_ONLY_STYLE_PROPS = new Set([
  "display",
  "margin-left",
  "margin-right",
  "width",
  "height",
  "max-width",
  "max-height",
]);

const TABLE_STYLE_PROPS = new Set([
  "border",
  "border-collapse",
  "border-width",
  "border-style",
  "border-color",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "text-align",
  "vertical-align",
  "width",
  "height",
  "background-color",
]);

const TABLE_TAGS = new Set(["TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD", "CAPTION"]);

const SIZE_VALUE_PATTERN = /^([\d.]+)(px|em|rem|%|pt)$/;
const UNSAFE_STYLE_VALUE = /url\(|expression\(|javascript:/i;

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
  if (UNSAFE_STYLE_VALUE.test(normalized)) return false;

  if (prop === "display") {
    return normalized === "block" || normalized === "inline" || normalized === "inline-block";
  }

  if (prop === "white-space") {
    return normalized === "pre-wrap" || normalized === "normal";
  }

  if (prop === "text-decoration") {
    return /^(none|underline|line-through)(\s+(none|underline|line-through))*$/.test(normalized);
  }

  if (prop === "padding-left") {
    const emMatch = normalized.match(/^([\d.]+)em$/);
    if (!emMatch) return false;
    const em = Number.parseFloat(emMatch[1]);
    return Number.isFinite(em) && em >= 0 && em <= 10;
  }

  if (prop === "margin-left" || prop === "margin-right") {
    return normalized === "auto" || normalized === "0" || normalized === "0px";
  }

  if (prop === "font-size" || prop === "width" || prop === "height" || prop === "max-width" || prop === "max-height") {
    if (normalized === "auto") return prop !== "font-size";
    const match = normalized.match(SIZE_VALUE_PATTERN);
    if (!match) return false;
    const amount = Number.parseFloat(match[1]);
    return Number.isFinite(amount) && amount >= 0 && amount <= 2000;
  }

  if (prop === "font-weight") {
    return /^(normal|bold|bolder|lighter|[1-9]00)$/.test(normalized);
  }

  if (prop.startsWith("border")) {
    return !UNSAFE_STYLE_VALUE.test(normalized);
  }

  if (prop === "vertical-align") {
    return ["top", "middle", "bottom", "baseline", "text-top", "text-bottom"].includes(normalized);
  }

  return true;
}

function filterStyleValue(value: string, tagName: string): string {
  const upper = tagName.toUpperCase();
  const isMedia = upper === "IMG" || upper === "VIDEO";
  const isTable = TABLE_TAGS.has(upper);

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
      if (TABLE_STYLE_PROPS.has(prop) && !isTable && !isMedia) {
        if (prop !== "text-align" && prop !== "padding-left" && prop !== "background-color") {
          return null;
        }
      }
      if (prop === "padding-left" && isMedia) return null;
      if (!isAllowedStyleValue(prop, val)) return null;

      return `${prop}: ${val}`;
    })
    .filter((part): part is string => part !== null)
    .join("; ");
}

function isAllowedColSpan(value: string): boolean {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) && num >= 1 && num <= 50;
}

/** 에디터 HTML — XSS 방지 후 저장·렌더 */
export function sanitizePostHtml(html: string, publicBaseUrl?: string): string {
  const { postAttributeHook, postAfterSanitizeAttributesHook } = createPostSanitizeHooks(
    resolvePublicBaseUrl(publicBaseUrl),
  );

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
