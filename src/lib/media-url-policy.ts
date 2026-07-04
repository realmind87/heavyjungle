/** 업로드 object key 소유권 검사 (순수 문자열) */
export function isOwnedAvatarKey(key: string, userId: string): boolean {
  return key.startsWith(`avatars/${userId}/`);
}

export function isOwnedCommentImageKey(key: string, userId: string): boolean {
  return key.startsWith(`comments/${userId}/`);
}

export function isOwnedPostImageKey(key: string, userId: string): boolean {
  return key.startsWith(`posts/${userId}/`);
}

/** 유튜브 iframe embed URL 허용 여부 */
export function isAllowedYoutubeEmbedSrc(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    if (url.hostname !== "www.youtube.com" && url.hostname !== "www.youtube-nocookie.com") {
      return false;
    }
    return url.pathname.startsWith("/embed/");
  } catch {
    return false;
  }
}

/** S3 공개 URL + prefix 허용 여부 */
export function isAllowedStoragePublicSrc(
  src: string,
  publicBaseUrl: string,
  prefix: "comments" | "posts",
): boolean {
  try {
    const url = new URL(src);
    const base = new URL(publicBaseUrl);
    const basePath = base.pathname.replace(/\/$/, "");
    return url.origin === base.origin && url.pathname.startsWith(`${basePath}/${prefix}/`);
  } catch {
    return false;
  }
}
