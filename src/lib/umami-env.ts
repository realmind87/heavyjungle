import { z } from "zod";

const umamiPublicSchema = z.object({
  src: z.string().url(),
  websiteId: z.string().min(1),
});

/** 브라우저 추적 스크립트 — NEXT_PUBLIC_* 없으면 null (클라이언트·서버 공용) */
export function getUmamiPublicConfig(): z.infer<typeof umamiPublicSchema> | null {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC?.trim();
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();
  if (!src || !websiteId) return null;

  const parsed = umamiPublicSchema.safeParse({
    src: src.replace(/\/$/, ""),
    websiteId,
  });
  return parsed.success ? parsed.data : null;
}
