/**
 * Umami 통계 API — 서버 전용, 토큰은 env에만 보관.
 */
import "server-only";

import type { UmamiAnalyticsSection, UmamiDashboardStats, UmamiMetricRow } from "@/features/admin/analytics-types";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { getUmamiServerConfig } from "@/lib/env";

const UMAMI_CACHE_TTL_SECONDS = 600;

type UmamiStatsResponse = {
  pageviews?: { value?: number };
  visitors?: { value?: number };
  visits?: { value?: number };
  bounces?: { value?: number };
  totaltime?: { value?: number };
};

type UmamiMetricsResponse = Array<{ x: string; y: number }>;

function rangeLast30Days(): { startAt: number; endAt: number } {
  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000;
  return { startAt, endAt };
}

async function umamiFetch<T>(path: string): Promise<T | null> {
  const config = getUmamiServerConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

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
