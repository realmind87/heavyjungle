import { Suspense } from "react";
import { getCurrentUser } from "@/server/auth/current-user";
import { MobileBottomNav } from "./mobile-bottom-nav";

/** 모바일 하단 탭바 서버 래퍼 — 로그인 사용자 프로필 링크 주입 */
export async function SiteBottomNav() {
  const user = await getCurrentUser();

  return (
    <Suspense fallback={null}>
      <MobileBottomNav username={user?.username ?? null} />
    </Suspense>
  );
}
