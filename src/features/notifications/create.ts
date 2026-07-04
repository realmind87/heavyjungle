/**
 * 다른 서버 액션 내부에서 호출하는 알림 생성 헬퍼.
 */
import "server-only";

import type { NotificationType } from "@/features/notifications/types";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";

export async function createNotification(options: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}): Promise<void> {
  if (options.recipientId === options.actorId) return;

  try {
    await db.insert(notifications).values({
      recipientId: options.recipientId,
      actorId: options.actorId,
      type: options.type,
      postId: options.postId ?? null,
      commentId: options.commentId ?? null,
    });
  } catch {
    // 알림 생성 실패는 원 동작(팔로우/댓글/좋아요)을 막지 않음
  }
}
