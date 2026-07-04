"use client";

import { PostContentPreview } from "@/features/posts/components/post-content-preview";
import { pageTitleClass } from "@/lib/ui-classes";

type PostDraftPreviewProps = {
  title: string;
  html: string;
};

/** 글 상세와 동일한 제목 + 본문 미리보기 */
export function PostDraftPreview({ title, html }: PostDraftPreviewProps) {
  return (
    <article>
      <h1 className={`mt-3 ${pageTitleClass}`}>{title}</h1>
      <PostContentPreview html={html} className="mt-8 min-h-[200px]" />
    </article>
  );
}
