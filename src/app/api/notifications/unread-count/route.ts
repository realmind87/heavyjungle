import { NextResponse } from "next/server";
import { getUnreadNotificationCount } from "@/features/notifications/queries";
import { getCurrentUser } from "@/server/auth/current-user";

/** 알림 뱃지 폴링용 경량 엔드포인트 — 안 읽은 개수만 반환 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ unreadCount: 0 });
  }

  const unreadCount = await getUnreadNotificationCount(user.id);
  return NextResponse.json({ unreadCount });
}
