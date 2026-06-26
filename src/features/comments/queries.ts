/**
 * 댓글 조회 쿼리.
 * 평면 조회 후 1단계 부모-자식 구조로 묶음 (대대댓글 없음).
 */
import "server-only";

import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { comments, users } from "@/server/db/schema";

export type CommentFlat = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
};

export type CommentWithReplies = CommentFlat & {
  replies: CommentFlat[];
};

export async function getCommentsByPost(postId: string): Promise<CommentFlat[]> {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      parentId: comments.parentId,
      content: comments.content,
      isDeleted: comments.isDeleted,
      createdAt: comments.createdAt,
      authorId: users.id,
      authorUsername: users.username,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));

  return rows.map((row) => ({
    id: row.id,
    postId: row.postId,
    parentId: row.parentId,
    content: row.content,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    author: { id: row.authorId, username: row.authorUsername },
  }));
}

/** 최상위 댓글 + 1단계 대댓글 트리 */
export function buildCommentThreads(flat: CommentFlat[]): CommentWithReplies[] {
  const topLevel: CommentWithReplies[] = [];
  const repliesByParent = new Map<string, CommentFlat[]>();

  for (const comment of flat) {
    if (comment.parentId) {
      const list = repliesByParent.get(comment.parentId) ?? [];
      list.push(comment);
      repliesByParent.set(comment.parentId, list);
    }
  }

  for (const comment of flat) {
    if (!comment.parentId) {
      topLevel.push({
        ...comment,
        replies: repliesByParent.get(comment.id) ?? [],
      });
    }
  }

  return topLevel;
}

export async function getCommentThreadsByPost(postId: string): Promise<CommentWithReplies[]> {
  const flat = await getCommentsByPost(postId);
  return buildCommentThreads(flat);
}
