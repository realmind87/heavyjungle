import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm";
import { ProfileSettingsPageShell } from "@/features/profile/components/ProfileSettingsPageShell";
import { requireProfileOwner } from "@/features/profile/require-profile-owner";

type PageProps = {
  params: Promise<{ username: string }>;
};

/** 비밀번호 변경 — 하드 내비/새로고침 풀페이지 */
export default async function ChangePasswordPage({ params }: PageProps) {
  const { username } = await params;
  const user = await requireProfileOwner(username, `/u/${username}/settings/password`);

  if (!user.passwordHash) {
    redirect(`/u/${username}`);
  }

  return (
    <ProfileSettingsPageShell username={username} title="비밀번호 변경">
      <ChangePasswordForm username={username} variant="page" />
    </ProfileSettingsPageShell>
  );
}
