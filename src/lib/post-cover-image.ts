export type PostCoverType = "image" | "video" | "youtube";

export type PostCoverMedia = {
  type: PostCoverType;
  previewUrl: string | null;
};

function extractYoutubeThumbnailUrl(src: string): string | null {
  try {
    const url = new URL(src);
    let videoId: string | null = null;

    if (url.hostname.includes("youtube") && url.pathname.startsWith("/embed/")) {
      videoId = url.pathname.split("/")[2] ?? null;
    } else if (url.hostname === "youtu.be") {
      videoId = url.pathname.replace(/^\/+/, "").split("/")[0] ?? null;
    } else if (url.hostname.includes("youtube") && url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    }

    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

/** 글 HTML 본문에서 대표 미디어(이미지/영상/유튜브) 추출 */
export function extractPostCoverMedia(content: string): PostCoverMedia | null {
  const imageMatch = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  if (imageMatch?.[1]) {
    return { type: "image", previewUrl: imageMatch[1] };
  }

  const videoTagMatch = content.match(/<video\b[^>]*>/i)?.[0] ?? "";
  const videoPosterMatch = videoTagMatch.match(/\bposter=["']([^"']+)["']/i);
  if (videoTagMatch) {
    return { type: "video", previewUrl: videoPosterMatch?.[1] ?? null };
  }

  const iframeMatch = content.match(/<iframe\b[^>]*\bsrc=["']([^"']+)["']/i);
  if (iframeMatch?.[1]) {
    return { type: "youtube", previewUrl: extractYoutubeThumbnailUrl(iframeMatch[1]) };
  }

  return null;
}
