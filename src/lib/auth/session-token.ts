/** Edge middleware에서도 사용 가능한 세션 쿠키 상수·형식 검사 */

export const SESSION_COOKIE_NAME = "hj_session";

/** 32바이트 base64url 토큰 형식 (middleware용, DB 조회 없음) */
export function isSessionTokenFormatValid(token: string | undefined): boolean {
  if (!token) return false;
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
