import { RouteModal } from "@/components/ui/RouteModal";
import { EditProfileForm } from "@/features/profile/components/EditProfileForm";
import { requireProfileOwner } from "@/features/profile/require-profile-owner";
import { resolveAvatarPublicUrl } from "@/lib/storage-url";

type PageProps = {
  params: Promise<{ username: string }>;
};

/** 프로필 수정 — 소프트 내비 인터셉트 모달 */
export default async function EditProfileInterceptPage({ params }: PageProps) {
  const { username } = await params;
  const user = await requireProfileOwner(username, `/u/${username}/edit`);
  const displayName = user.displayName ?? user.username;

  return (
    <RouteModal title="프로필 수정">
      <EditProfileForm
        username={username}
        variant="modal"
        displayName={displayName}
        initial={{
          displayName: user.displayName ?? "",
          bio: user.bio ?? "",
          avatarPublicUrl: resolveAvatarPublicUrl(user.avatarUrl),
        }}
      />
    </RouteModal>
  );
}
