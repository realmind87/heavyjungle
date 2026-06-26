import { redirect } from "next/navigation";
import { ChangeEmailForm } from "@/features/profile/components/ChangeEmailForm";
import { ProfileSettingsPageShell } from "@/features/profile/components/ProfileSettingsPageShell";
import { requireProfileOwner } from "@/features/profile/require-profile-owner";

type PageProps = {
  params: Promise<{ username: string }>;
};

/** 이메일 변경 — 하드 내비/새로고침 풀페이지 */
export default async function ChangeEmailPage({ params }: PageProps) {
  const { username } = await params;
  const user = await requireProfileOwner(username, `/u/${username}/settings/email`);

  if (!user.passwordHash) {
    redirect(`/u/${username}`);
  }

  return (
    <ProfileSettingsPageShell username={username} title="이메일 변경">
      <ChangeEmailForm username={username} variant="page" currentEmail={user.email} />
    </ProfileSettingsPageShell>
  );
}
