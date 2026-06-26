import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { PostEditForm } from "@/features/posts/components/post-edit-form";
import { getPostById } from "@/features/posts/queries";
import { canModifyPost } from "@/server/auth/permissions";
import { getCurrentUser } from "@/server/auth/current-user";

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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href={`/posts/${postId}`} className="text-sm text-zinc-500 hover:underline">
          ← 글 보기
        </Link>
        <h1 className="mt-4 text-2xl font-bold">글 수정</h1>
        <div className="mt-6">
          <PostEditForm postId={postId} initialTitle={post.title} initialContent={post.content} />
        </div>
      </main>
    </div>
  );
}
