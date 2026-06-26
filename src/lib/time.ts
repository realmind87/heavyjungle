/**
 * 상대 시간 표시 유틸.
 */
export function formatRelativeTime(date: Date | string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diffMs = target.getTime() - Date.now();
  const absSec = Math.round(Math.abs(diffMs) / 1000);

  const rtf = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });

  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), "second");
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60_000), "minute");
  if (absSec < 86_400) return rtf.format(Math.round(diffMs / 3_600_000), "hour");
  if (absSec < 2_592_000) return rtf.format(Math.round(diffMs / 86_400_000), "day");
  if (absSec < 31_536_000) return rtf.format(Math.round(diffMs / 2_592_000_000), "month");
  return rtf.format(Math.round(diffMs / 31_536_000_000), "year");
}
