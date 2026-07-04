import { Suspense } from "react";
import { getUnreadNotificationCount } from "@/features/notifications/queries";
import { getCurrentUser } from "@/server/auth/current-user";
import { MobileBottomNav } from "./mobile-bottom-nav";

/** 모바일 하단 탭바 서버 래퍼 — 프로필·알림 뱃지 주입 */
export async function SiteBottomNav() {
  const user = await getCurrentUser();
  const unreadNotificationCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <Suspense fallback={null}>
      <MobileBottomNav
        username={user?.username ?? null}
        initialUnreadCount={unreadNotificationCount}
      />
    </Suspense>
  );
}
