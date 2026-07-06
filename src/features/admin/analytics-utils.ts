import type { DailyCount } from "@/features/admin/analytics-types";

/** 최근 N일 일별 시리즈 — 누락 날짜는 0으로 채움 */
export function fillDailySeries(rows: DailyCount[], days: number, now = new Date()): DailyCount[] {
  const map = new Map(rows.map((row) => [row.day, row.count]));
  const result: DailyCount[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - offset);
    const day = date.toISOString().slice(0, 10);
    result.push({ day, count: map.get(day) ?? 0 });
  }

  return result;
}

export function formatDayLabel(day: string): string {
  const [, month, date] = day.split("-");
  return `${Number(month)}/${Number(date)}`;
}

export function calcRatio(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}
