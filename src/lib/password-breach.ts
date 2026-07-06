import { createHash } from "node:crypto";

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";
const REQUEST_TIMEOUT_MS = 4000;

export const BREACHED_PASSWORD_MESSAGE =
  "이 비밀번호는 유출된 적이 있어 사용할 수 없습니다. 다른 비밀번호를 입력해 주세요.";

/**
 * Have I Been Pwned k-anonymity range API.
 * API 장애 시 fail-open (차단하지 않음).
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  const digest = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);

  try {
    const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) return false;

    const body = await response.text();
    return body.split("\n").some((line) => {
      const [hashSuffix] = line.split(":");
      return hashSuffix === suffix;
    });
  } catch {
    return false;
  }
}

export async function assertPasswordNotBreached(password: string): Promise<string | null> {
  if (await isPasswordBreached(password)) {
    return BREACHED_PASSWORD_MESSAGE;
  }
  return null;
}
