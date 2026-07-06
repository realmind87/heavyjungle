/** 외부 링크 정책 — sanitize·Safe Browsing 검사 공용 (서버 전용 아님) */

const HREF_PATTERN = /href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

function parseHttpUrl(href: string): URL | null {
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function getAppHostname(): string | null {
  const raw = process.env.APP_URL;
  if (!raw) return null;
  try {
    return new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function getStoragePublicOrigin(): string | null {
  const raw = process.env.S3_PUBLIC_URL ?? process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin.toLowerCase();
  } catch {
    return null;
  }
}

function isInternalSiteHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "heavyjungle.com" || host.endsWith(".heavyjungle.com")) return true;
  const appHost = getAppHostname();
  return appHost !== null && host === appHost;
}

/** 본인 사이트 링크 — nofollow 제외 */
export function isInternalSiteLink(href: string): boolean {
  const url = parseHttpUrl(href);
  return url !== null && isInternalSiteHost(url.hostname);
}

/** MinIO/S3 공개 스토리지 링크 */
export function isStoragePublicLink(href: string): boolean {
  const url = parseHttpUrl(href);
  const storageOrigin = getStoragePublicOrigin();
  if (!url || !storageOrigin) return false;
  return url.origin.toLowerCase() === storageOrigin;
}

/** Safe Browsing API 검사 스킵 대상 */
export function shouldSkipLinkSafetyCheck(href: string): boolean {
  return isInternalSiteLink(href) || isStoragePublicLink(href);
}

/** A 태그 rel — 내부 링크는 nofollow 제외 */
export function getAnchorRel(href: string): string {
  return isInternalSiteLink(href)
    ? "noopener noreferrer"
    : "noopener noreferrer nofollow ugc";
}

/** 정제된 HTML에서 http(s) href 추출 (중복 제거, 원문 순서 유지) */
export function extractLinks(html: string): string[] {
  const seen = new Set<string>();
  const links: string[] = [];

  for (const match of html.matchAll(HREF_PATTERN)) {
    const href = (match[1] ?? match[2] ?? "").trim();
    if (!href) continue;
    const url = parseHttpUrl(href);
    if (!url) continue;
    const normalized = url.href;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    links.push(normalized);
  }

  return links;
}

/** Safe Browsing 검사 대상 외부 링크 (내부·스토리지 제외) */
export function extractExternalLinks(html: string): string[] {
  return extractLinks(html).filter((url) => !shouldSkipLinkSafetyCheck(url));
}

export function hasExternalLinks(html: string): boolean {
  return extractExternalLinks(html).length > 0;
}
