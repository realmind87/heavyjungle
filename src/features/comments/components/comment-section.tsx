/**
 * 글 상세 댓글 영역 — 서버에서 스레드 조회 후 클라이언트에 직렬화 데이터 전달.
 */
import { getCommentThreadsByPost, type CommentFlat, type CommentWithReplies } from "@/features/comments/queries";
import { CommentForm } from "@/features/comments/components/comment-form";
import { CommentThread, type SerializableCommentThread } from "@/features/comments/components/comment-item";
import { canModifyComment } from "@/server/auth/permissions";
import type { User } from "@/server/db/schema/users";
import { mutedTextClass } from "@/lib/ui-classes";

type CommentSectionProps = {
  postId: string;
  commentCount: number;
  user: User | null;
};

function serializeComment(comment: CommentFlat, user: User | null) {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    content: comment.content,
    isDeleted: comment.isDeleted,
    createdAt: comment.createdAt.toISOString(),
    author: comment.author,
    canDelete: canModifyComment(user, comment.author.id),
  };
}

function serializeThread(threads: CommentWithReplies[], user: User | null): SerializableCommentThread[] {
  return threads.map((thread) => ({
    ...serializeComment(thread, user),
    replies: thread.replies.map((reply) => serializeComment(reply, user)),
  }));
}

export async function CommentSection({ postId, commentCount, user }: CommentSectionProps) {
  const threads = await getCommentThreadsByPost(postId);
  const serialized = serializeThread(threads, user);

  return (
    <section className="mt-10 dark:border-zinc-800">
      {user ? (
        <div>
          <CommentForm postId={postId} />
        </div>
      ) : (
        <p className={`mt-4 ${mutedTextClass}`}>댓글을 작성하려면 로그인하세요.</p>
      )}

      <div className="mt-6">
        {serialized.length === 0 ? (
          <p className={mutedTextClass}>아직 댓글이 없습니다.</p>
        ) : (
          serialized.map((thread) => (
            <CommentThread key={thread.id} thread={thread} postId={postId} isLoggedIn={!!user} />
          ))
        )}
      </div>
    </section>
  );
}
