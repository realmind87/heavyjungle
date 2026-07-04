import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";

type BuildPageMetadataInput = {
  title: string;
  description?: string;
  path: string;
  imageUrl?: string | null;
  noIndex?: boolean;
};

const DEFAULT_DESCRIPTION = "Heavy Jungle — 개발자 커뮤니티";

/** 페이지별 Open Graph / Twitter 메타데이터 빌더 */
export function buildPageMetadata({
  title,
  description,
  path,
  imageUrl,
  noIndex,
}: BuildPageMetadataInput): Metadata {
  const fullTitle = title === "Heavy Jungle" ? title : `${title} | Heavy Jungle`;
  const desc = description?.trim() || DEFAULT_DESCRIPTION;
  const url = absoluteUrl(path);
  const images = imageUrl ? [{ url: imageUrl, alt: title }] : undefined;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: "Heavy Jungle",
      locale: "ko_KR",
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: fullTitle,
      description: desc,
      ...(images ? { images: [images[0].url] } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** HTML 본문에서 OG description용 plain text 추출 */
export function plainTextFromHtml(html: string, maxLength = 160): string {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/** 본문 HTML에서 첫 이미지 src 추출 (OG 미리보기용) */
export function firstImageFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}
