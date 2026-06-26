/**
 * createdAt + id 복합 커서 인코딩 (offset 페이지네이션 대신 사용).
 */
import { z } from "zod";

const cursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.uuid(),
});

export type CompositeCursor = z.infer<typeof cursorSchema>;

export function encodeCursor(cursor: CompositeCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeCursor(raw: string | undefined | null): CompositeCursor | null {
  if (!raw) return null;
  try {
    const json = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    const parsed = cursorSchema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export function buildCursorPage<T extends { createdAt: Date; id: string }>(
  rows: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id }) : null;

  return { items, nextCursor, hasMore };
}
