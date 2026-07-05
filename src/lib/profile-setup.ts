export const PROFILE_SETUP_QUERY = "setupProfile";

export function profileSetupDismissedKey(userId: string) {
  return `hj-profile-setup-dismissed:${userId}`;
}

export function isProfileSetupDismissed(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(profileSetupDismissedKey(userId)) === "1";
}

export function dismissProfileSetup(userId: string) {
  localStorage.setItem(profileSetupDismissedKey(userId), "1");
}

/** 회원가입 직후 프로필 설정 모달을 띄우기 위한 리다이렉트 경로 */
export function withSetupProfileQuery(path: string): string {
  const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";
  const qIndex = safePath.indexOf("?");
  const pathname = qIndex === -1 ? safePath : safePath.slice(0, qIndex);
  const params = new URLSearchParams(qIndex === -1 ? "" : safePath.slice(qIndex + 1));
  params.set(PROFILE_SETUP_QUERY, "1");
  const query = params.toString();
  return query ? `${pathname}?${query}` : `${pathname}?${PROFILE_SETUP_QUERY}=1`;
}
