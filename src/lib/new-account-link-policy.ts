/** 신규 계정 외부 링크 남용 완화 정책 (순수 함수) */

export const NEW_ACCOUNT_LINK_POLICY_DAYS = 7;

/** 신규 계정 글 — 외부 링크 포함 등록 (24시간) */
export const NEW_ACCOUNT_EXTERNAL_LINK_POST_LIMIT = 3;
export const NEW_ACCOUNT_EXTERNAL_LINK_POST_WINDOW_SECONDS = 24 * 60 * 60;

/** 신규 계정 댓글 — 외부 링크 포함 등록 (24시간) */
export const NEW_ACCOUNT_EXTERNAL_LINK_COMMENT_LIMIT = 10;
export const NEW_ACCOUNT_EXTERNAL_LINK_COMMENT_WINDOW_SECONDS = 24 * 60 * 60;

export const NEW_ACCOUNT_EXTERNAL_LINK_RATE_LIMIT_MESSAGE =
  "신규 계정은 외부 링크가 포함된 글·댓글 등록이 제한됩니다. 잠시 후 다시 시도해 주세요.";

export function isNewAccount(
  createdAt: Date,
  days: number = NEW_ACCOUNT_LINK_POLICY_DAYS,
): boolean {
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
  return createdAt.getTime() > cutoffMs;
}

export function shouldApplyNewAccountLinkPolicy(
  createdAt: Date,
  isAdmin: boolean,
  days: number = NEW_ACCOUNT_LINK_POLICY_DAYS,
): boolean {
  return !isAdmin && isNewAccount(createdAt, days);
}

export function newAccountAgeDays(createdAt: Date): number {
  const ms = Date.now() - createdAt.getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
