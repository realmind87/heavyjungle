"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import { deleteComment, type CommentActionState } from "@/features/comments/actions";
import { CommentComposer } from "@/features/comments/components/comment-composer";
import { CommentContent } from "@/features/comments/components/comment-content";
import { displayCommentContent } from "@/features/comments/display";
import { formatRelativeTime } from "@/lib/time";
import { ProfileAuthorLink } from "@/features/profile/components/ProfileAuthorLink";

export type SerializableComment = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarPublicUrl: string | null;
  };
  canDelete: boolean;
};

export type SerializableCommentNode = SerializableComment & {
  replies: SerializableCommentNode[];
};

/** @deprecated SerializableCommentNode 사용 */
export type SerializableCommentThread = SerializableCommentNode;

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type ReplyFormProps = {
  postId: string;
  parentId: string;
  onCancel: () => void;
};

function ReplyForm({ postId, parentId, onCancel }: ReplyFormProps) {
  return (
    <div className="mt-2">
      <CommentComposer
        postId={postId}
        parentId={parentId}
        placeholder="답글 작성"
        submitLabel="답글 달기"
        onCancel={onCancel}
        autoFocus
        compact
      />
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
    </svg>
  );
}

function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [state, formAction, pending] = useActionState(deleteComment, {} as CommentActionState);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="commentId" value={commentId} />
      <button
        type="submit"
        disabled={pending}
        aria-label={pending ? "삭제 중" : "삭제"}
        className="inline-flex shrink-0 items-center justify-center p-1 text-zinc-500 transition hover:text-red-600 disabled:opacity-50 dark:hover:text-red-400"
      >
        <TrashIcon />
      </button>
    </form>
  );
}

type CommentNodeProps = {
  comment: SerializableCommentNode;
  postId: string;
  isLoggedIn: boolean;
  depth?: number;
};

/** 단일 댓글 노드 — Reddit 스타일 들여쓰기·세로선, 재귀 답글 */
export function CommentNode({ comment, postId, isLoggedIn, depth = 0 }: CommentNodeProps) {
  const [showReply, setShowReply] = useState(false);
  const isNested = depth > 0;

  return (
    <div
      className={isNested ? "mt-2" : "mt-4"}
    >
      <article className="rounded-lg bg-white p-3 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <ProfileAuthorLink
              username={comment.author.username}
              displayName={comment.author.displayName}
              avatarUrl={comment.author.avatarPublicUrl}
            />
            <span className="shrink-0">· {formatRelativeTime(comment.createdAt)}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {isLoggedIn && !comment.isDeleted && (
              <button
                type="button"
                onClick={() => setShowReply((open) => !open)}
                aria-label={showReply ? "답글 취소" : "답글"}
                className={`inline-flex items-center justify-center p-1 transition ${showReply ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
              >
                <CommentIcon />
              </button>
            )}
            {comment.canDelete && !comment.isDeleted && <DeleteCommentButton commentId={comment.id} />}
          </div>
        </div>

        <CommentContent
          content={displayCommentContent(comment.content, comment.isDeleted)}
          isDeleted={comment.isDeleted}
          className={`mt-2 pl-8 ${comment.isDeleted ? "italic text-zinc-400 dark:text-zinc-500" : ""}`}
        />

        {showReply && (
          <div className="pl-8">
            <ReplyForm postId={postId} parentId={comment.id} onCancel={() => setShowReply(false)} />
          </div>
        )}
      </article>

      {comment.replies.length > 0 && (
        <div className="ml-8 border-l-2 border-zinc-200 dark:border-zinc-700">
          {comment.replies.map((reply) => (
            <CommentNode key={reply.id} comment={reply} postId={postId} isLoggedIn={isLoggedIn} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/** 최상위 댓글 목록 */
export function CommentThread({
  thread,
  postId,
  isLoggedIn,
}: {
  thread: SerializableCommentNode;
  postId: string;
  isLoggedIn: boolean;
}) {
  return <CommentNode comment={thread} postId={postId} isLoggedIn={isLoggedIn} depth={0} />;
}
