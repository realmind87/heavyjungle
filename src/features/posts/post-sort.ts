import { z } from "zod";

export const postSortSchema = z.enum(["latest", "popular", "oldest"]);
export type PostSort = z.infer<typeof postSortSchema>;

export const POST_SORT_LABELS: Record<PostSort, string> = {
  latest: "최신순",
  popular: "인기순",
  oldest: "오래된순",
};

const latestCursorSchema = z.object({
  sort: z.literal("latest"),
  createdAt: z.string().datetime(),
  id: z.uuid(),
});

const popularCursorSchema = z.object({
  sort: z.literal("popular"),
  likeCount: z.number().int(),
  id: z.uuid(),
});

const oldestCursorSchema = z.object({
  sort: z.literal("oldest"),
  createdAt: z.string().datetime(),
  id: z.uuid(),
});

const postCursorSchema = z.discriminatedUnion("sort", [
  latestCursorSchema,
  popularCursorSchema,
  oldestCursorSchema,
]);

export type PostCursor = z.infer<typeof postCursorSchema>;

export function encodePostCursor(cursor: PostCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodePostCursor(raw: string | undefined | null, sort: PostSort): PostCursor | null {
  if (!raw) return null;
  try {
    const json = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const parsed = postCursorSchema.safeParse(json);
    if (!parsed.success || parsed.data.sort !== sort) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function parsePostSort(value: string | undefined): PostSort {
  const parsed = postSortSchema.safeParse(value);
  return parsed.success ? parsed.data : "latest";
}
