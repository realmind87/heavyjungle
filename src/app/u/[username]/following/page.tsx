import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { FollowUserList } from "@/features/follows/components/follow-user-list";
import { listFollowing } from "@/features/follows/queries";
import { getPublicProfileByUsername } from "@/features/profile/queries";
import { linkMutedClass, pageTitleClass } from "@/lib/ui-classes";

type PageProps = {
  params: Promise<{ username: string }>;
};

export default async function FollowingPage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile) notFound();

  const following = await listFollowing(profile.id);
  const displayName = profile.displayName ?? profile.username;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href={`/u/${username}`} className={linkMutedClass}>
          ← {displayName}
        </Link>
        <h1 className={`mt-4 ${pageTitleClass}`}>팔로잉</h1>
        <div className="mt-6">
          <FollowUserList users={following} emptyMessage="아직 팔로잉한 사용자가 없습니다." />
        </div>
      </main>
    </div>
  );
}
