"use client";

type OptimizedHtmlContentProps = {
  html: string;
  className?: string;
  /** 하위 호환 — 스타일·클래스는 sanitize된 HTML과 postContentProseClass 가 적용 */
  imageClassName?: string;
};

/** sanitize된 HTML 그대로 렌더 — 이미지 정렬·인라인 스타일 보존 */
export function OptimizedHtmlContent({ html, className = "" }: OptimizedHtmlContentProps) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
