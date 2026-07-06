import { headers } from "next/headers";

export async function getUserAgent(): Promise<string | null> {
  const headerStore = await headers();
  return headerStore.get("user-agent");
}

export function summarizeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "알 수 없는 기기";

  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("mac os")) return "macOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("linux")) return "Linux";
  return "웹 브라우저";
}
