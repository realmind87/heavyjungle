import { z } from "zod";

export const commentSortSchema = z.enum(["latest", "popular", "oldest"]);
export type CommentSort = z.infer<typeof commentSortSchema>;

export const COMMENT_SORT_LABELS: Record<CommentSort, string> = {
  latest: "최신순",
  popular: "인기순",
  oldest: "오래된순",
};

export function parseCommentSort(value: string | undefined): CommentSort {
  const parsed = commentSortSchema.safeParse(value);
  return parsed.success ? parsed.data : "latest";
}

type SortableComment = {
  id: string;
  likeCount: number;
  createdAt: Date;
};

/** 최상위 댓글 정렬 — 인기순은 좋아요 수, 동률이면 최신순 */
export function compareComments(a: SortableComment, b: SortableComment, sort: CommentSort): number {
  if (sort === "popular") {
    if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
    return b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id);
  }
  if (sort === "oldest") {
    return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);
  }
  return b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id);
}
