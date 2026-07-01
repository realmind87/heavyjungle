/**
 * 댓글 조회 쿼리.
 * 평면 조회 후 parentId 기준 재귀 트리로 묶음.
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
    displayName: string | null;
    avatarUrl: string | null;
  };
};

export type CommentNode = CommentFlat & {
  replies: CommentNode[];
};

/** @deprecated CommentNode 사용 */
export type CommentWithReplies = CommentNode;

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
      authorDisplayName: users.displayName,
      authorAvatarUrl: users.avatarUrl,
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
    author: {
      id: row.authorId,
      username: row.authorUsername,
      displayName: row.authorDisplayName,
      avatarUrl: row.authorAvatarUrl,
    },
  }));
}

/** 평면 댓글 목록 → 무한 깊이 트리 */
export function buildCommentTree(flat: CommentFlat[]): CommentNode[] {
  const byParent = new Map<string | null, CommentFlat[]>();

  for (const comment of flat) {
    const siblings = byParent.get(comment.parentId) ?? [];
    siblings.push(comment);
    byParent.set(comment.parentId, siblings);
  }

  function buildChildren(parentId: string | null): CommentNode[] {
    return (byParent.get(parentId) ?? []).map((comment) => ({
      ...comment,
      replies: buildChildren(comment.id),
    }));
  }

  return buildChildren(null);
}

/** @deprecated buildCommentTree 사용 */
export function buildCommentThreads(flat: CommentFlat[]): CommentNode[] {
  return buildCommentTree(flat);
}

export async function getCommentTreeByPost(postId: string): Promise<CommentNode[]> {
  const flat = await getCommentsByPost(postId);
  return buildCommentTree(flat);
}

/** @deprecated getCommentTreeByPost 사용 */
export async function getCommentThreadsByPost(postId: string): Promise<CommentNode[]> {
  return getCommentTreeByPost(postId);
}
