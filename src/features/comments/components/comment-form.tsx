"use client";

import { CommentComposer } from "@/features/comments/components/comment-composer";

type CommentFormProps = {
  postId: string;
  placeholder?: string;
};

/** 최상위 댓글 작성 폼 */
export function CommentForm({ postId, placeholder = "댓글을 입력하세요" }: CommentFormProps) {
  return <CommentComposer postId={postId} placeholder={placeholder} />;
}
