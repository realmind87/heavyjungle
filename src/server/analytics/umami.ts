/**
 * Umami 통계 API — 서버 전용, 인증 정보는 env에만 보관.
 */
import "server-only";

import type { UmamiAnalyticsSection, UmamiDashboardStats, UmamiMetricRow } from "@/features/admin/analytics-types";
import { cacheDel, cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { getUmamiServerConfig } from "@/lib/env";

const UMAMI_CACHE_TTL_SECONDS = 600;
const UMAMI_TOKEN_CACHE_TTL_SECONDS = 60 * 60;

type UmamiServerConfig = NonNullable<ReturnType<typeof getUmamiServerConfig>>;

type UmamiStatsResponse = {
  pageviews?: { value?: number };
  visitors?: { value?: number };
  visits?: { value?: number };
  bounces?: { value?: number };
  totaltime?: { value?: number };
};

type UmamiMetricsResponse = Array<{ x: string; y: number }>;

function umamiTokenCacheKey(config: UmamiServerConfig): string {
  const suffix = config.username ?? "static-token";
  return cacheKey("umami", "auth", suffix);
}

function rangeLast30Days(): { startAt: number; endAt: number } {
  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000;
  return { startAt, endAt };
}

async function loginUmami(config: UmamiServerConfig): Promise<string | null> {
  if (!config.username || !config.password) return null;

  try {
    const response = await fetch(`${config.apiUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        username: config.username,
        password: config.password,
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { token?: string };
    if (!data.token) return null;

    await cacheSet(umamiTokenCacheKey(config), data.token, UMAMI_TOKEN_CACHE_TTL_SECONDS);
    return data.token;
  } catch {
    return null;
  }
}

async function getUmamiToken(config: UmamiServerConfig): Promise<string | null> {
  if (config.apiToken) return config.apiToken;

  const cached = await cacheGet<string>(umamiTokenCacheKey(config));
  if (cached) return cached;

  return loginUmami(config);
}

async function umamiFetch<T>(path: string): Promise<T | null> {
  const config = getUmamiServerConfig();
  if (!config) return null;

  const doFetch = (token: string) =>
    fetch(`${config.apiUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

  let token = await getUmamiToken(config);
  if (!token) return null;

  try {
    let response = await doFetch(token);

    if (response.status === 401 && !config.apiToken) {
      await cacheDel(umamiTokenCacheKey(config));
      token = await loginUmami(config);
      if (!token) return null;
      response = await doFetch(token);
    }

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mapStats(payload: UmamiStatsResponse | null): UmamiDashboardStats | null {
  if (!payload) return null;
  return {
    pageviews: payload.pageviews?.value ?? 0,
    visitors: payload.visitors?.value ?? 0,
    visits: payload.visits?.value ?? 0,
    bounces: payload.bounces?.value ?? 0,
    totalTime: payload.totaltime?.value ?? 0,
  };
}

function mapMetrics(rows: UmamiMetricsResponse | null, limit = 8): UmamiMetricRow[] {
  if (!rows) return [];
  return rows
    .slice(0, limit)
    .map((row) => ({ label: row.x || "(없음)", count: row.y }))
    .filter((row) => row.count > 0);
}

async function fetchUmamiAnalytics(): Promise<UmamiAnalyticsSection> {
  const config = getUmamiServerConfig();
  if (!config) {
    return {
      stats: null,
      topPages: [],
      referrers: [],
      devices: [],
      error: null,
    };
  }

  const { startAt, endAt } = rangeLast30Days();
  const query = `startAt=${startAt}&endAt=${endAt}`;
  const base = `/api/websites/${config.websiteId}`;

  const [statsPayload, pagesPayload, referrersPayload, devicesPayload] = await Promise.all([
    umamiFetch<UmamiStatsResponse>(`${base}/stats?${query}`),
    umamiFetch<UmamiMetricsResponse>(`${base}/metrics?type=url&${query}`),
    umamiFetch<UmamiMetricsResponse>(`${base}/metrics?type=referrer&${query}`),
    umamiFetch<UmamiMetricsResponse>(`${base}/metrics?type=device&${query}`),
  ]);

  if (!statsPayload && !pagesPayload && !referrersPayload && !devicesPayload) {
    return {
      stats: null,
      topPages: [],
      referrers: [],
      devices: [],
      error: "Umami API에 연결할 수 없습니다. 설정을 확인해 주세요.",
    };
  }

  return {
    stats: mapStats(statsPayload),
    topPages: mapMetrics(pagesPayload),
    referrers: mapMetrics(referrersPayload),
    devices: mapMetrics(devicesPayload),
    error: null,
  };
}

export async function getUmamiAnalytics(): Promise<UmamiAnalyticsSection> {
  const key = cacheKey("admin", "umami", "analytics");
  const cached = await cacheGet<UmamiAnalyticsSection>(key);
  if (cached) return cached;

  const data = await fetchUmamiAnalytics();
  await cacheSet(key, data, UMAMI_CACHE_TTL_SECONDS);
  return data;
}
