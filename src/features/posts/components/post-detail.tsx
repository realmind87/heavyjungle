import { PostContent } from "@/features/posts/components/post-content";
import { PostDetailActions } from "@/features/posts/components/post-detail-actions";
import { PostDetailHeader } from "@/features/posts/components/post-detail-header";
import { pageTitleClass } from "@/lib/ui-classes";

type PostDetailProps = {
  post: {
    id: string;
    title: string;
    content: string;
    likeCount: number;
    viewCount: number;
    commentCount: number;
    createdAt: Date;
    author: {
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
    };
  };
  liked: boolean;
  isLoggedIn: boolean;
  canEdit: boolean;
  canReport: boolean;
};

/** 글 상세 본문 — article + 액션 바 */
export function PostDetail({ post, liked, isLoggedIn, canEdit, canReport }: PostDetailProps) {
  return (
    <>
      <article className="mt-6">
        <PostDetailHeader
          postId={post.id}
          createdAt={post.createdAt}
          author={post.author}
          canEdit={canEdit}
        />
        <h1 className={`mt-3 ${pageTitleClass}`}>{post.title}</h1>
        <PostContent content={post.content} />
      </article>

      <PostDetailActions
        postId={post.id}
        likeCount={post.likeCount}
        viewCount={post.viewCount}
        commentCount={post.commentCount}
        liked={liked}
        isLoggedIn={isLoggedIn}
        canReport={canReport}
      />
    </>
  );
}
