import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/current-user";

/** 레거시 설정 페이지 → 공개 프로필로 리다이렉트 */
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/settings");

  redirect(`/u/${user.username}`);
}
