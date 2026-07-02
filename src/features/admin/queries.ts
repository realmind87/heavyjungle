/**
 * 관리자 전용 조회 쿼리.
 */
import "server-only";

import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { comments, posts, users } from "@/server/db/schema";

const ADMIN_LIST_LIMIT = 50;

export type AdminPostListItem = {
  id: string;
  title: string;
  isDeleted: boolean;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
};

export type AdminCommentListItem = {
  id: string;
  postId: string;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  author: {
    id: string;
    username: string;
  };
};

export type AdminUserListItem = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: Date;
};

export async function listAdminPosts(): Promise<AdminPostListItem[]> {
  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      isDeleted: posts.isDeleted,
      createdAt: posts.createdAt,
      authorId: users.id,
      authorUsername: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(ADMIN_LIST_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    author: {
      id: row.authorId,
      username: row.authorUsername,
    },
  }));
}

export async function listAdminComments(): Promise<AdminCommentListItem[]> {
  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      content: comments.content,
      isDeleted: comments.isDeleted,
      createdAt: comments.createdAt,
      authorId: users.id,
      authorUsername: users.username,
    })
    .from(comments)
    .innerJoin(users, eq(comments.authorId, users.id))
    .orderBy(desc(comments.createdAt))
    .limit(ADMIN_LIST_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    postId: row.postId,
    content: row.content,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt,
    author: {
      id: row.authorId,
      username: row.authorUsername,
    },
  }));
}

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(ADMIN_LIST_LIMIT);

  return rows;
}
