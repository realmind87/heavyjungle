"use client";

import { OptimizedHtmlContent } from "@/components/ui/optimized-html-content";
import { postContentImageClass, postContentProseClass } from "@/lib/post-content-styles";
import { isPostHtmlContent } from "@/lib/sanitize-post-html";

type PostContentRendererProps = {
  content: string;
  className?: string;
};

/** 게시·미리보기 공용 본문 렌더 (에디터와 동일 `.post-content` + img 최적화) */
export function PostContentRenderer({ content, className = "" }: PostContentRendererProps) {
  const rootClass = className ? `${className} ${postContentProseClass}` : postContentProseClass;

  if (isPostHtmlContent(content)) {
    return (
      <OptimizedHtmlContent
        html={content}
        className={rootClass}
        imageClassName={postContentImageClass}
      />
    );
  }

  return <div className={rootClass}>{content}</div>;
}
