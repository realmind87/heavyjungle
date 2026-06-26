"use client";

import { useActionState, useState } from "react";
import { createComment, deleteComment, type CommentActionState } from "@/features/comments/actions";
import { displayCommentContent } from "@/features/comments/display";
import { formatRelativeTime } from "@/lib/time";

export type SerializableComment = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  author: { id: string; username: string };
  canDelete: boolean;
};

export type SerializableCommentThread = SerializableComment & {
  replies: SerializableComment[];
};

type CommentItemProps = {
  comment: SerializableComment;
  postId: string;
  isLoggedIn: boolean;
  canDelete: boolean;
  isReply?: boolean;
  showReplyButton?: boolean;
};

function ReplyForm({ postId, parentId }: { postId: string; parentId: string }) {
  const [state, formAction, pending] = useActionState(createComment, {} as CommentActionState);

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="parentId" value={parentId} />
      <textarea name="content" required rows={2} className="w-full border px-2 py-1 text-sm" placeholder="답글 작성" />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="border px-2 py-1 text-xs disabled:opacity-50">
        {pending ? "등록 중..." : "답글 달기"}
      </button>
    </form>
  );
}

function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [state, formAction, pending] = useActionState(deleteComment, {} as CommentActionState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="commentId" value={commentId} />
      <button type="submit" disabled={pending} className="text-xs text-red-600 hover:underline disabled:opacity-50">
        {pending ? "삭제 중..." : "삭제"}
      </button>
      {state.error && <span className="ml-2 text-xs text-red-600">{state.error}</span>}
    </form>
  );
}

/** 단일 댓글 — 삭제 표시, 답글 토글, 삭제 버튼 */
export function CommentItem({
  comment,
  postId,
  isLoggedIn,
  canDelete,
  isReply = false,
  showReplyButton = false,
}: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);

  return (
    <div className={isReply ? "ml-6 mt-3 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700" : "mt-4"}>
      <div className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
        <p className="text-xs text-zinc-500">
          {comment.author.username} · {formatRelativeTime(comment.createdAt)}
        </p>
        <p className={`mt-1 whitespace-pre-wrap text-sm ${comment.isDeleted ? "text-zinc-400 italic" : ""}`}>
          {displayCommentContent(comment.content, comment.isDeleted)}
        </p>
        <div className="mt-2 flex items-center gap-3">
          {isLoggedIn && showReplyButton && !comment.isDeleted && (
            <button
              type="button"
              onClick={() => setShowReply((v) => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showReply ? "답글 취소" : "답글"}
            </button>
          )}
          {canDelete && !comment.isDeleted && <DeleteCommentButton commentId={comment.id} />}
        </div>
        {showReply && <ReplyForm postId={postId} parentId={comment.id} />}
      </div>
    </div>
  );
}

/** 댓글 + 1단계 대댓글 스레드 */
export function CommentThread({
  thread,
  postId,
  isLoggedIn,
}: {
  thread: SerializableCommentThread;
  postId: string;
  isLoggedIn: boolean;
}) {
  return (
    <div>
      <CommentItem
        comment={thread}
        postId={postId}
        isLoggedIn={isLoggedIn}
        canDelete={thread.canDelete}
        showReplyButton
      />
      {thread.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          isLoggedIn={isLoggedIn}
          canDelete={reply.canDelete}
          isReply
        />
      ))}
    </div>
  );
}
