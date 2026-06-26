import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PostList } from "@/features/posts/components/post-list";
import { ProfileActionLinks } from "@/features/profile/components/ProfileActionLinks";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { UserPostsLoadMore } from "@/features/profile/components/UserPostsLoadMore";
import { getPublicProfileByUsername, getUserPosts } from "@/features/profile/queries";
import { getCurrentUser } from "@/server/auth/current-user";
import { resolveAvatarPublicUrl } from "@/lib/storage-url";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ cursor?: string }>;
};

/** 공개 프로필 페이지 — 서버 컴포넌트 */
export default async function PublicProfilePage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { cursor } = await searchParams;

  const [profile, currentUser] = await Promise.all([
    getPublicProfileByUsername(username),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const isOwner = currentUser?.username === profile.username;
  const postsPage = await getUserPosts(profile.id, { cursor, limit: 20 });
  const displayName = profile.displayName ?? profile.username;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-start gap-4">
          <ProfileAvatar
            name={displayName}
            avatarUrl={resolveAvatarPublicUrl(profile.avatarUrl)}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="text-sm text-zinc-500">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {profile.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500">
              <span>글 {profile.stats.postCount}</span>
              <span>받은 좋아요 {profile.stats.likesReceived}</span>
              <span>
                가입일{" "}
                {profile.createdAt.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {isOwner && currentUser && (
              <div className="mt-4">
                <ProfileActionLinks username={profile.username} hasPassword={!!currentUser.passwordHash} />
              </div>
            )}
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-lg font-semibold">작성 글</h2>
          <div className="mt-4">
            <PostList posts={postsPage.items} />
            <UserPostsLoadMore username={profile.username} nextCursor={postsPage.nextCursor} />
          </div>
        </section>
      </main>
    </div>
  );
}
