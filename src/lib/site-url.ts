import { env } from "@/lib/env";

/** 절대 URL 생성용 사이트 베이스 (APP_URL, trailing slash 제거) */
export function getSiteUrl(): string {
  return env.APP_URL.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
