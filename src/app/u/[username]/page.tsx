import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { getBlockRelation, listBlockedUsers } from "@/features/blocks/queries";
import { ProfileFollowSection } from "@/features/follows/components/profile-follow-section";
import { getFollowStats, isFollowingUser } from "@/features/follows/queries";
import { PostList } from "@/features/posts/components/post-list";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { ProfileSettingsMenu } from "@/features/profile/components/ProfileSettingsMenu";
import { UserPostsLoadMore } from "@/features/profile/components/UserPostsLoadMore";
import { getPublicProfileByUsername, getUserPosts } from "@/features/profile/queries";
import { getCurrentUser } from "@/server/auth/current-user";
import { isAdmin } from "@/server/auth/permissions";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { mutedTextClass, pageTitleClass, sectionTitleClass, successTextClass } from "@/lib/ui-classes";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ cursor?: string; email?: string }>;
};

/** 공개 프로필 페이지 — 서버 컴포넌트 */
export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { cursor, email } = await searchParams;

  const [profile, currentUser] = await Promise.all([
    getPublicProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const isOwner = currentUser?.username === profile.username;
  const blockRelation =
    currentUser && !isOwner
      ? await getBlockRelation(currentUser.id, profile.id)
      : { isBlocking: false, isBlockedBy: false };

  const isBlockedRelation = blockRelation.isBlocking || blockRelation.isBlockedBy;
  const canViewContent = isOwner || !isBlockedRelation;

  const [postsPage, followStats, isFollowing, blockedUsers] = await Promise.all([
    canViewContent
      ? getUserPosts(profile.id, { cursor, limit: 20 })
      : Promise.resolve({ items: [], nextCursor: null, hasMore: false }),
    canViewContent
      ? getFollowStats(profile.id)
      : Promise.resolve({ followerCount: 0, followingCount: 0 }),
    currentUser && !isOwner && !isBlockedRelation
      ? isFollowingUser(currentUser.id, profile.id)
      : Promise.resolve(false),
    isOwner && currentUser ? listBlockedUsers(currentUser.id) : Promise.resolve([]),
  ]);
  const displayName = profile.displayName ?? profile.username;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {isOwner && email === "updated" && (
          <p className={`mb-6 ${successTextClass}`}>이메일이 변경되었습니다.</p>
        )}
        <div className="flex items-start gap-4">
          <ProfileAvatar
            name={displayName}
            avatarUrl={canViewContent ? resolveStoragePublicUrl(profile.avatarUrl) : null}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className={pageTitleClass}>{displayName}</h1>
                <p className={mutedTextClass}>@{profile.username}</p>
              </div>
              <ProfileSettingsMenu
                username={profile.username}
                targetUserId={profile.id}
                isOwner={isOwner}
                hasPassword={!!currentUser?.passwordHash}
                isLoggedIn={!!currentUser}
                isAdmin={isOwner && !!currentUser && isAdmin(currentUser)}
                isBlocking={blockRelation.isBlocking}
                likesReceived={canViewContent ? profile.stats.likesReceived : 0}
                createdAt={profile.createdAt.toISOString()}
                blockedUsers={blockedUsers}
              />
            </div>

            {blockRelation.isBlocking && (
              <p className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                차단한 사용자입니다. 설정에서 차단을 해제할 수 있습니다.
              </p>
            )}

            {blockRelation.isBlockedBy && !blockRelation.isBlocking && (
              <p className="mt-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                이 프로필을 볼 수 없습니다.
              </p>
            )}

            {canViewContent && profile.bio && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {profile.bio}
              </p>
            )}

            {canViewContent && (
              <ProfileFollowSection
                username={profile.username}
                targetUserId={profile.id}
                postCount={profile.stats.postCount}
                initialFollowing={isFollowing}
                initialFollowerCount={followStats.followerCount}
                followingCount={followStats.followingCount}
                isOwner={isOwner}
                isLoggedIn={!!currentUser}
                isBlockedRelation={isBlockedRelation}
              />
            )}
          </div>
        </div>

        {canViewContent ? (
          <section className="mt-12">
            <h2 className={sectionTitleClass}>작성 글</h2>
            <div className="mt-4">
              <PostList posts={postsPage.items} />
              <UserPostsLoadMore username={profile.username} nextCursor={postsPage.nextCursor} />
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
