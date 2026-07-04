/**
 * 알림 조회 쿼리 (읽기 전용).
 */
import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import type { NotificationItem } from "@/features/notifications/types";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { db } from "@/server/db";
import { notifications, posts, users } from "@/server/db/schema";

const NOTIFICATION_LIST_LIMIT = 20;

export type NotificationsPage = {
  items: NotificationItem[];
  hasMore: boolean;
};

/** 알림 목록 (페이지네이션) — 최신순, limit+1로 다음 페이지 존재 여부 판단 */
export async function listNotificationsPage(
  recipientId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<NotificationsPage> {
  const limit = options.limit ?? NOTIFICATION_LIST_LIMIT;
  const offset = options.offset ?? 0;

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
      actorUsername: users.username,
      actorDisplayName: users.displayName,
      actorAvatarUrl: users.avatarUrl,
      postId: posts.id,
      postTitle: posts.title,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.actorId, users.id))
    .leftJoin(posts, eq(notifications.postId, posts.id))
    .where(eq(notifications.recipientId, recipientId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map((row) => ({
      id: row.id,
      type: row.type,
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
      actor: {
        username: row.actorUsername,
        displayName: row.actorDisplayName,
        avatarUrl: resolveStoragePublicUrl(row.actorAvatarUrl),
      },
      post: row.postId ? { id: row.postId, title: row.postTitle ?? "" } : null,
    })),
    hasMore,
  };
}

export async function listNotifications(recipientId: string): Promise<NotificationItem[]> {
  const { items } = await listNotificationsPage(recipientId, { limit: NOTIFICATION_LIST_LIMIT });
  return items;
}

export async function getUnreadNotificationCount(recipientId: string): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.recipientId, recipientId), eq(notifications.isRead, false)));

  return row?.count ?? 0;
}
