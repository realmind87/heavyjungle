import { redirect } from "next/navigation";
import { SecuritySettings } from "@/features/auth/components/security-settings";
import { ProfileSettingsPageShell } from "@/features/profile/components/ProfileSettingsPageShell";
import { requireProfileOwner } from "@/features/profile/require-profile-owner";
import { getSessionTokenFromCookies } from "@/server/auth/cookies";
import { hashSessionTokenForLookup } from "@/server/auth/session";
import { listUserSessions } from "@/server/auth/session-management";
import { isTotpEnabled } from "@/server/auth/totp";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function SecuritySettingsPage({ params }: PageProps) {
  const { username } = await params;
  const user = await requireProfileOwner(username, `/u/${username}/settings/security`);

  if (!user.passwordHash) {
    redirect(`/u/${username}`);
  }

  const currentToken = await getSessionTokenFromCookies();
  if (!currentToken) {
    redirect(`/login?next=/u/${username}/settings/security`);
  }

  const currentTokenHash = await hashSessionTokenForLookup(currentToken);
  const sessions = await listUserSessions(user.id, currentTokenHash);

  return (
    <ProfileSettingsPageShell username={username} title="보안 설정">
      <SecuritySettings totpEnabled={isTotpEnabled(user)} sessions={sessions} />
    </ProfileSettingsPageShell>
  );
}
