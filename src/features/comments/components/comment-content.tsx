"use client";

import { OptimizedHtmlContent } from "@/components/ui/optimized-html-content";
import { isCommentHtmlContent, stripCommentNbsp } from "@/lib/sanitize-comment-html";

type CommentContentProps = {
  content: string;
  isDeleted: boolean;
  className?: string;
};

const commentHtmlClass =
  "text-sm text-zinc-900 dark:text-zinc-100 [&_a]:break-all [&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400";

export function CommentContent({ content, isDeleted, className = "" }: CommentContentProps) {
  if (isDeleted) {
    return (
      <p className={`whitespace-pre-wrap text-sm italic text-zinc-400 dark:text-zinc-500 ${className}`}>
        {content}
      </p>
    );
  }

  if (isCommentHtmlContent(content)) {
    return (
      <OptimizedHtmlContent
        html={content}
        className={`${commentHtmlClass} ${className}`}
        imageClassName="my-1 block max-w-full h-auto rounded-md"
      />
    );
  }

  return (
    <p className={`whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100 ${className}`}>
      {stripCommentNbsp(content)}
    </p>
  );
}
