/**
 * S3/MinIO 공개 URL 조합 — 클라이언트·서버 공용.
 *
 * DB(avatarUrl)에는 object key만 저장 (예: avatars/{userId}/{uuid}.jpg).
 * NEXT_PUBLIC_S3_PUBLIC_URL + key로 조합합니다.
 * http(s)로 시작하면 외부 URL로 간주해 그대로 사용합니다.
 */

function getPublicBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_S3_PUBLIC_URL is not set");
  }
  return base.replace(/\/$/, "");
}

export function buildPublicObjectUrlFromEnv(key: string): string {
  return `${getPublicBaseUrl()}/${key}`;
}

export function resolveAvatarPublicUrl(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (stored.startsWith("http://") || stored.startsWith("https://")) {
    return stored;
  }
  return buildPublicObjectUrlFromEnv(stored);
}

/** 공개 URL 또는 object key에서 storage key 추출 (posts/, comments/ 등) */
export function parseStorageObjectKeyFromPublicUrl(
  src: string,
  prefix: "posts" | "comments" | "avatars",
): string | null {
  if (src.startsWith(`${prefix}/`)) {
    return src;
  }

  try {
    const url = new URL(src);
    const baseUrl = new URL(getPublicBaseUrl());
    const basePath = baseUrl.pathname.replace(/\/$/, "");
    let objectPath = url.pathname;

    if (basePath && objectPath.startsWith(basePath)) {
      objectPath = objectPath.slice(basePath.length);
    }

    const key = objectPath.replace(/^\//, "");
    return key.startsWith(`${prefix}/`) ? key : null;
  } catch {
    return null;
  }
}
