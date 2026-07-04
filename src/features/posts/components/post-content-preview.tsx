"use client";

import { useMemo } from "react";
import { PostContentRenderer } from "@/features/posts/components/post-content-renderer";
import { sanitizePostHtml } from "@/lib/sanitize-post-html-core";

type PostContentPreviewProps = {
  html: string;
  className?: string;
};

/** 작성 중 미리보기 — 저장 시와 동일한 sanitize + 노출 스타일 */
export function PostContentPreview({ html, className = "min-h-[200px]" }: PostContentPreviewProps) {
  const publicBaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL ?? "";
  const sanitized = useMemo(
    () => sanitizePostHtml(html, publicBaseUrl),
    [html, publicBaseUrl],
  );
  return <PostContentRenderer content={sanitized} className={className} />;
}
