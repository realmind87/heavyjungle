/**
 * 글 상세 댓글 영역 — 서버에서 스레드 조회 후 클라이언트에 직렬화 데이터 전달.
 */
import type { CommentSort } from "@/features/comments/comment-sort";
import { getCommentTreeByPost, type CommentFlat, type CommentNode } from "@/features/comments/queries";
import { CommentForm } from "@/features/comments/components/comment-form";
import { CommentSortFilter } from "@/features/comments/components/comment-sort-filter";
import { CommentThread, type SerializableCommentNode } from "@/features/comments/components/comment-item";
import { getUserCommentLikesForPost } from "@/features/likes/queries";
import { canModifyComment } from "@/server/auth/permissions";
import type { User } from "@/server/db/schema/users";
import { mutedTextClass } from "@/lib/ui-classes";
import { resolveStoragePublicUrl } from "@/lib/storage-url";

type CommentSectionProps = {
  postId: string;
  user: User | null;
  sort: CommentSort;
  listParam?: string;
  commentCount: number;
};

function serializeComment(
  comment: CommentFlat,
  user: User | null,
  likedCommentIds: Set<string>,
): SerializableCommentNode {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    content: comment.content,
    isDeleted: comment.isDeleted,
    likeCount: comment.likeCount,
    liked: likedCommentIds.has(comment.id),
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.author.id,
      username: comment.author.username,
      displayName: comment.author.displayName,
      avatarPublicUrl: resolveStoragePublicUrl(comment.author.avatarUrl),
    },
    canDelete: canModifyComment(user, comment.author.id),
    canReport: !!user && user.id !== comment.author.id,
    replies: [],
  };
}

function serializeTree(
  nodes: CommentNode[],
  user: User | null,
  likedCommentIds: Set<string>,
): SerializableCommentNode[] {
  return nodes.map((node) => ({
    ...serializeComment(node, user, likedCommentIds),
    replies: serializeTree(node.replies, user, likedCommentIds),
  }));
}

export async function CommentSection({ postId, user, sort, listParam, commentCount }: CommentSectionProps) {
  const [tree, likedCommentIds] = await Promise.all([
    getCommentTreeByPost(postId, sort),
    user ? getUserCommentLikesForPost(user.id, postId) : Promise.resolve(new Set<string>()),
  ]);
  const serialized = serializeTree(tree, user, likedCommentIds);

  return (
    <section className="mt-10 dark:border-zinc-800">
      {user ? (
        <div>
          <CommentForm postId={postId} />
        </div>
      ) : (
        <p className={`mt-4 ${mutedTextClass}`}>댓글을 작성하려면 로그인하세요.</p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">댓글 ({commentCount})</h2>
        {commentCount > 0 && <CommentSortFilter sort={sort} listParam={listParam} />}
      </div>

      <div>
        {serialized.length === 0 ? (
          <div className="mt-10">
            <p className={`text-center text-xl font-bold text-black dark:text-white`}>첫 번째 댓글을 남겨 보세요</p>
            <p className={`mt-4 text-center ${mutedTextClass}`}>게시물에 아직 댓글이 달리지 않았습니다.</p>
          </div>
        ) : (
          serialized.map((thread) => (
            <CommentThread key={thread.id} thread={thread} postId={postId} isLoggedIn={!!user} />
          ))
        )}
      </div>
    </section>
  );
}
