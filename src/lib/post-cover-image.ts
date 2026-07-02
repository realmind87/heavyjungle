/** 글 HTML 본문에서 첫 번째 이미지 src 추출 */
export function extractPostCoverImageUrl(content: string): string | null {
  const match = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}
