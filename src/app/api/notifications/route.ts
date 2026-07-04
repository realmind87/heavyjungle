import { NextResponse, type NextRequest } from "next/server";
import { getUnreadNotificationCount, listNotificationsPage } from "@/features/notifications/queries";
import { getCurrentUser } from "@/server/auth/current-user";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const [{ items, hasMore }, unreadCount] = await Promise.all([
    listNotificationsPage(user.id, { limit, offset }),
    getUnreadNotificationCount(user.id),
  ]);

  return NextResponse.json({ items, hasMore, unreadCount });
}
