import "server-only";

import { env } from "@/lib/env";
import { sanitizePostHtml as sanitizePostHtmlCore } from "@/lib/sanitize-post-html-core";

export function sanitizePostHtml(html: string): string {
  return sanitizePostHtmlCore(html, env.S3_PUBLIC_URL);
}
