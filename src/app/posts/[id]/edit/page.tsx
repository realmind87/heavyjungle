import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PostForm } from "@/features/posts/components/post-form";
import { getPostById } from "@/features/posts/queries";
import { canModifyPost, isAdmin } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/current-user";
import { linkMutedClass } from "@/lib/ui-classes";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostEditPage({ params }: PageProps) {
  const { id: postId } = await params;
  const [post, user] = await Promise.all([getPostById(postId), getCurrentUser()]);

  if (!post || post.isDeleted) notFound();
  if (!user) redirect(`/login?next=/posts/${postId}/edit`);
  if (!canModifyPost(user, post.author.id)) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-12 md:pb-8">
        <Link href={`/posts/${postId}`} className={linkMutedClass}>
          ← 글 보기
        </Link>
        <div className="mt-6">
          <PostForm
            mode="edit"
            postId={postId}
            initialTitle={post.title}
            initialContent={post.content}
            initialCategory={post.category}
            cancelHref={`/posts/${postId}`}
            isAdmin={isAdmin(user)}
          />
        </div>
      </main>
    </div>
  );
}
