import { EditProfileForm } from "@/features/profile/components/EditProfileForm";
import { ProfileSettingsPageShell } from "@/features/profile/components/ProfileSettingsPageShell";
import { requireProfileOwner } from "@/features/profile/require-profile-owner";
import { resolveStoragePublicUrl } from "@/lib/storage-url";

type PageProps = {
  params: Promise<{ username: string }>;
};

/** 프로필 수정 — 하드 내비/새로고침 풀페이지 */
export default async function EditProfilePage({ params }: PageProps) {
  const { username } = await params;
  const user = await requireProfileOwner(username, `/u/${username}/edit`);

  return (
    <ProfileSettingsPageShell username={username} title="프로필 수정">
      <EditProfileForm
        username={username}
        variant="page"
        initial={{
          displayName: user.displayName ?? "",
          bio: user.bio ?? "",
          avatarPublicUrl: resolveStoragePublicUrl(user.avatarUrl),
        }}
      />
    </ProfileSettingsPageShell>
  );
}
