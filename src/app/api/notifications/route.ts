import { NextResponse } from "next/server";
import { getUnreadNotificationCount, listNotifications } from "@/features/notifications/queries";
import { getCurrentUser } from "@/server/auth/current-user";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const [items, unreadCount] = await Promise.all([
    listNotifications(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return NextResponse.json({ items, unreadCount });
}
