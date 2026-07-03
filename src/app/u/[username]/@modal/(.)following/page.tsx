import { notFound } from "next/navigation";
import { RouteModal } from "@/components/ui/RouteModal";
import { FollowUserList } from "@/features/follows/components/follow-user-list";
import { listFollowing } from "@/features/follows/queries";
import { getPublicProfileByUsername } from "@/features/profile/queries";

type PageProps = {
  params: Promise<{ username: string }>;
};

/** 팔로잉 목록 — 소프트 내비 인터셉트 모달 */
export default async function FollowingInterceptPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  const following = await listFollowing(profile.id);

  return (
    <RouteModal title="팔로잉">
      <FollowUserList users={following} emptyMessage="아직 팔로잉한 사용자가 없습니다." />
    </RouteModal>
  );
}
