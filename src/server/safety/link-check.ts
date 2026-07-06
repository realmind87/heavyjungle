/**
 * Google Safe Browsing 링크 검사 — 서버 전용.
 * API 키 없음·장애 시 fail-open (저장 허용).
 */
import "server-only";

import { createHash } from "node:crypto";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { env } from "@/lib/env";
import {
  extractLinks,
  shouldSkipLinkSafetyCheck,
} from "@/lib/link-url-policy";
import { logger } from "@/lib/logger";

export { extractLinks } from "@/lib/link-url-policy";

const SAFE_BROWSING_API = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const CACHE_TTL_SECONDS = 6 * 60 * 60;
const REQUEST_TIMEOUT_MS = 5000;
const CLIENT_ID = "heavyjungle";
const CLIENT_VERSION = "1.0.0";

export const UNSAFE_LINK_MESSAGE =
  "안전하지 않은 링크가 포함되어 있어 등록할 수 없습니다.";

type SafeBrowsingMatch = {
  threat?: { url?: string };
};

type SafeBrowsingResponse = {
  matches?: SafeBrowsingMatch[];
};

type LinkSafetyCacheEntry = {
  safe: boolean;
};

function cacheKeyForUrl(url: string): string {
  const hash = createHash("sha256").update(url).digest("hex").slice(0, 32);
  return cacheKey("safebrowsing", hash);
}

async function getCachedSafety(url: string): Promise<boolean | null> {
  try {
    const entry = await cacheGet<LinkSafetyCacheEntry>(cacheKeyForUrl(url));
    if (!entry) return null;
    return entry.safe;
  } catch {
    return null;
  }
}

async function setCachedSafety(url: string, safe: boolean): Promise<void> {
  try {
    await cacheSet(cacheKeyForUrl(url), { safe }, CACHE_TTL_SECONDS);
  } catch {
    // fail-open — 캐시 실패는 무시
  }
}

async function lookupUrlsWithApi(
  urls: string[],
): Promise<{ unsafe: Set<string>; checked: boolean }> {
  const apiKey = env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    logger.warn("safebrowsing: API key not configured, skipping link check");
    return { unsafe: new Set(), checked: false };
  }

  if (urls.length === 0) return { unsafe: new Set(), checked: true };

  try {
    const response = await fetch(`${SAFE_BROWSING_API}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: {
          clientId: CLIENT_ID,
          clientVersion: CLIENT_VERSION,
        },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: urls.map((url) => ({ url })),
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      logger.warn("safebrowsing: API request failed", { status: response.status });
      return { unsafe: new Set(), checked: false };
    }

    const data = (await response.json()) as SafeBrowsingResponse;
    const unsafe = new Set<string>();

    for (const match of data.matches ?? []) {
      const url = match.threat?.url;
      if (url) unsafe.add(url);
    }

    return { unsafe, checked: true };
  } catch (error) {
    logger.warn("safebrowsing: API call error", { error: String(error) });
    return { unsafe: new Set(), checked: false };
  }
}

/**
 * URL 목록 중 악성으로 판정된 URL 반환.
 * API 키 없음·장애·Redis 장애 시 빈 배열 (fail-open).
 */
export async function checkUrlsSafe(urls: string[]): Promise<string[]> {
  const toCheck = urls.filter((url) => !shouldSkipLinkSafetyCheck(url));
  if (toCheck.length === 0) return [];

  const uncached: string[] = [];
  const unsafe: string[] = [];

  for (const url of toCheck) {
    const cached = await getCachedSafety(url);
    if (cached === false) {
      unsafe.push(url);
    } else if (cached === null) {
      uncached.push(url);
    }
  }

  if (uncached.length > 0) {
    const { unsafe: apiUnsafe, checked } = await lookupUrlsWithApi(uncached);

    if (checked) {
      const apiUnsafeList = [...apiUnsafe];

      for (const url of uncached) {
        const isUnsafe = apiUnsafe.has(url);
        await setCachedSafety(url, !isUnsafe);
        if (isUnsafe) unsafe.push(url);
      }

      if (apiUnsafeList.length > 0) {
        logger.warn("safebrowsing: unsafe URLs detected", { urls: apiUnsafeList });
      }
    }
  }

  return unsafe;
}

/** sanitize 직후 HTML 링크 검사 — 악성 시 에러 메시지, 통과 시 null */
export async function assertContentLinksSafe(html: string): Promise<string | null> {
  const links = extractLinks(html);
  const unsafe = await checkUrlsSafe(links);
  if (unsafe.length > 0) {
    logger.warn("content: blocked unsafe links", { urls: unsafe });
    return UNSAFE_LINK_MESSAGE;
  }
  return null;
}
