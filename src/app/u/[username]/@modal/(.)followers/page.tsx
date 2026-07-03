import { notFound } from "next/navigation";
import { RouteModal } from "@/components/ui/RouteModal";
import { FollowUserList } from "@/features/follows/components/follow-user-list";
import { listFollowers } from "@/features/follows/queries";
import { getPublicProfileByUsername } from "@/features/profile/queries";

type PageProps = {
  params: Promise<{ username: string }>;
};

/** 팔로워 목록 — 소프트 내비 인터셉트 모달 */
export default async function FollowersInterceptPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  const followers = await listFollowers(profile.id);

  return (
    <RouteModal title="팔로워">
      <FollowUserList users={followers} emptyMessage="아직 팔로워가 없습니다." />
    </RouteModal>
  );
}
