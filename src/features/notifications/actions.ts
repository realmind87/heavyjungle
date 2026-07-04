"use server";

import { and, eq } from "drizzle-orm";
import { requireUser } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const user = await requireUser();
  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.recipientId, user.id), eq(notifications.isRead, false)));

  return {};
}
