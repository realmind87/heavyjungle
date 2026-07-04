"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "@/components/ui/toast";
import { deleteComment, type CommentActionState } from "@/features/comments/actions";
import { CommentComposer } from "@/features/comments/components/comment-composer";
import { CommentContent } from "@/features/comments/components/comment-content";
import { CommentLikeButton } from "@/features/comments/components/comment-like-button";
import { displayCommentContent } from "@/features/comments/display";
import { ReportButton } from "@/features/reports/components/report-button";
import { formatRelativeTime } from "@/lib/time";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";

/** depth 1부터 답글 트리를 접음 — depth 0의 직계 답글만 기본 노출 */
const COLLAPSE_REPLIES_FROM_DEPTH = 1;

export type SerializableComment = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarPublicUrl: string | null;
  };
  canDelete: boolean;
  canReport: boolean;
};

export type CommentAuthorRef = SerializableComment["author"];

export type SerializableCommentNode = SerializableComment & {
  replies: SerializableCommentNode[];
};

/** @deprecated SerializableCommentNode 사용 */
export type SerializableCommentThread = SerializableCommentNode;

function countDescendantReplies(replies: SerializableCommentNode[]): number {
  return replies.reduce((sum, reply) => sum + 1 + countDescendantReplies(reply.replies), 0);
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
        onSuccess={onCancel}
        autoFocus
        compact
      />
    </div>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
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

type CommentActionButtonsProps = {
  comment: SerializableComment;
  isLoggedIn: boolean;
  showReply: boolean;
  onToggleReply: () => void;
};

function CommentActionButtons({ comment, isLoggedIn, showReply, onToggleReply }: CommentActionButtonsProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {!comment.isDeleted && (
        <CommentLikeButton
          commentId={comment.id}
          initialLiked={comment.liked}
          initialLikeCount={comment.likeCount}
          isLoggedIn={isLoggedIn}
        />
      )}
      {isLoggedIn && !comment.isDeleted && (
        <button
          type="button"
          onClick={onToggleReply}
          aria-label={showReply ? "답글 취소" : "답글"}
          className={`inline-flex items-center justify-center p-1 transition ${
            showReply
              ? "text-blue-600 dark:text-blue-400"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <CommentIcon />
        </button>
      )}
      {comment.canReport && !comment.isDeleted && (
        <ReportButton targetType="comment" targetId={comment.id} />
      )}
      {comment.canDelete && !comment.isDeleted && <DeleteCommentButton commentId={comment.id} />}
    </div>
  );
}

function ReplyTargetLabel({ author }: { author: CommentAuthorRef }) {
  return (
    <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">
      <span aria-hidden="true" className="mr-1 text-zinc-400 dark:text-zinc-500">
        ↳
      </span>
      <Link href={`/u/${author.username}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
        @{author.username}
      </Link>
      <span>에게 답글</span>
    </p>
  );
}

type RepliesToggleProps = {
  expanded: boolean;
  replyCount: number;
  onToggle: () => void;
};

function RepliesToggle({ expanded, replyCount, onToggle }: RepliesToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="mt-2 text-xs font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
    >
      {expanded ? "답글 숨기기" : `답글 보기 (${replyCount})`}
    </button>
  );
}

type CommentNodeProps = {
  comment: SerializableCommentNode;
  postId: string;
  isLoggedIn: boolean;
  depth?: number;
  replyTo?: CommentAuthorRef | null;
};

/** depth 스레드 — 들여쓰기·세로선, depth 1+ 답글은 접기/펼치기 */
export function CommentNode({
  comment,
  postId,
  isLoggedIn,
  depth = 0,
  replyTo = null,
}: CommentNodeProps) {
  const [showReply, setShowReply] = useState(false);
  const collapsible = depth >= COLLAPSE_REPLIES_FROM_DEPTH && comment.replies.length > 0;
  const [repliesExpanded, setRepliesExpanded] = useState(!collapsible);

  const displayName = comment.author.displayName ?? comment.author.username;
  const avatarSize = depth === 0 ? "sm" : "xs";
  const replyCount = countDescendantReplies(comment.replies);
  const showReplies = comment.replies.length > 0 && (!collapsible || repliesExpanded);

  return (
    <div className={depth === 0 ? "mt-4" : "mt-3"}>
      <article className="flex gap-3 px-1">
        <Link
          href={`/u/${comment.author.username}`}
          className="shrink-0 pt-0.5 transition hover:opacity-80"
          aria-label={`${displayName} 프로필`}
        >
          <ProfileAvatar name={displayName} avatarUrl={comment.author.avatarPublicUrl} size={avatarSize} />
        </Link>

        <div className="min-w-0 flex-1">
          {depth > 0 && replyTo && !comment.isDeleted && <ReplyTargetLabel author={replyTo} />}

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 text-sm">
              <Link
                href={`/u/${comment.author.username}`}
                className="font-semibold text-zinc-900 transition hover:opacity-80 dark:text-zinc-50"
              >
                {displayName}
              </Link>
              <span className="ml-2 text-xs font-normal text-zinc-400 dark:text-zinc-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            <CommentActionButtons
              comment={comment}
              isLoggedIn={isLoggedIn}
              showReply={showReply}
              onToggleReply={() => setShowReply((open) => !open)}
            />
          </div>

          <CommentContent
            content={displayCommentContent(comment.content, comment.isDeleted)}
            isDeleted={comment.isDeleted}
            className={`mt-1.5 ${comment.isDeleted ? "italic text-zinc-400 dark:text-zinc-500" : ""}`}
          />

          {showReply && (
            <ReplyForm postId={postId} parentId={comment.id} onCancel={() => setShowReply(false)} />
          )}
        </div>
      </article>

      {comment.replies.length > 0 && (
        <div className="relative mt-2 ml-3 border-l-2 border-zinc-200 pl-4 sm:ml-4 sm:pl-5 dark:border-zinc-700">
          {collapsible && (
            <RepliesToggle
              expanded={repliesExpanded}
              replyCount={replyCount}
              onToggle={() => setRepliesExpanded((open) => !open)}
            />
          )}

          {showReplies && (
            <div className={collapsible ? "mt-2 space-y-0" : "space-y-0"}>
              {comment.replies.map((reply) => (
                <CommentNode
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  isLoggedIn={isLoggedIn}
                  depth={depth + 1}
                  replyTo={comment.author}
                />
              ))}
            </div>
          )}
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
