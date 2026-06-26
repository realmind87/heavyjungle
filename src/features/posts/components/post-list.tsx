import { PostCard } from "@/features/posts/components/post-card";
import type { PostListItem } from "@/features/posts/queries";

type PostListProps = {
  posts: PostListItem[];
};

/** PostCard 목록 래퍼 */
export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">글이 없습니다.</p>;
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
