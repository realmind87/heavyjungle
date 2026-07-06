"use client";

import { useActionState } from "react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import {
  beginTotpSetup,
  confirmTotpSetup,
  disableTotp,
  revokeOtherSessions,
  revokeSession,
  type SecurityActionState,
} from "@/features/auth/security-actions";
import type { UserSessionSummary } from "@/server/auth/session-management";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  errorTextClass,
  inputClass,
  labelClass,
  mutedTextClass,
  sectionTitleClass,
  successTextClass,
} from "@/lib/ui-classes";

type SecuritySettingsProps = {
  totpEnabled: boolean;
  sessions: UserSessionSummary[];
};

function formatWhen(date: Date): string {
  return new Date(date).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export function SecuritySettings({ totpEnabled, sessions }: SecuritySettingsProps) {
  const [setupState, setupAction, setupPending] = useActionState(beginTotpSetup, {} as SecurityActionState);
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmTotpSetup, {} as SecurityActionState);
  const [disableState, disableAction, disablePending] = useActionState(disableTotp, {} as SecurityActionState);
  const [revokeState, revokeAction, revokePending] = useActionState(revokeSession, {} as SecurityActionState);
  const [revokeOthersState, revokeOthersAction, revokeOthersPending] = useActionState(
    revokeOtherSessions,
    {} as SecurityActionState,
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!setupState.totpUri) {
      setQrDataUrl(null);
      return;
    }
    void QRCode.toDataURL(setupState.totpUri).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [setupState.totpUri]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className={sectionTitleClass}>활성 세션</h2>
        <p className={`mt-1 ${mutedTextClass}`}>현재 로그인된 기기 목록입니다.</p>
        <ul className="mt-4 space-y-3">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-3 dark:border-zinc-800"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {session.deviceLabel}
                  {session.isCurrent ? " (현재)" : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  IP {session.ipAddress ?? "unknown"} · {formatWhen(session.lastSeenAt)}
                </p>
              </div>
              {!session.isCurrent && (
                <form action={revokeAction}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <button type="submit" disabled={revokePending} className={buttonSecondaryClass}>
                    종료
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {sessions.length > 1 && (
          <form action={revokeOthersAction} className="mt-4">
            <button type="submit" disabled={revokeOthersPending} className={buttonSecondaryClass}>
              다른 기기 모두 종료
            </button>
          </form>
        )}
        {revokeState.message && <p className={`mt-3 ${successTextClass}`}>{revokeState.message}</p>}
        {revokeOthersState.message && <p className={`mt-3 ${successTextClass}`}>{revokeOthersState.message}</p>}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className={sectionTitleClass}>2단계 인증 (TOTP)</h2>
        {totpEnabled ? (
          <form action={disableAction} className="mt-4 space-y-4">
            <p className={mutedTextClass}>인증 앱이 연결되어 있습니다.</p>
            <label className="block">
              <span className={labelClass}>현재 비밀번호</span>
              <input name="password" type="password" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>인증 코드</span>
              <input name="code" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required className={inputClass} />
            </label>
            {disableState.error && <p className={errorTextClass}>{disableState.error}</p>}
            {disableState.message && <p className={successTextClass}>{disableState.message}</p>}
            <button type="submit" disabled={disablePending} className={buttonDangerClass}>
              2단계 인증 끄기
            </button>
          </form>
        ) : setupState.pendingTotpToken ? (
          <form action={confirmAction} className="mt-4 space-y-4">
            <input type="hidden" name="pendingTotpToken" value={setupState.pendingTotpToken} />
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="TOTP QR 코드" className="mx-auto h-48 w-48 rounded-lg border border-zinc-200 dark:border-zinc-700" />
            )}
            {setupState.totpSecret && (
              <p className={`break-all text-center text-xs ${mutedTextClass}`}>수동 입력: {setupState.totpSecret}</p>
            )}
            <label className="block">
              <span className={labelClass}>인증 코드</span>
              <input name="code" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6} required className={inputClass} />
            </label>
            {confirmState.error && <p className={errorTextClass}>{confirmState.error}</p>}
            {confirmState.message && <p className={successTextClass}>{confirmState.message}</p>}
            <button type="submit" disabled={confirmPending} className={buttonPrimaryClass}>
              활성화
            </button>
          </form>
        ) : (
          <form action={setupAction} className="mt-4 space-y-4">
            <p className={mutedTextClass}>Google Authenticator 등 인증 앱으로 로그인을 보호합니다.</p>
            <label className="block">
              <span className={labelClass}>현재 비밀번호</span>
              <input name="password" type="password" required className={inputClass} />
            </label>
            {setupState.error && <p className={errorTextClass}>{setupState.error}</p>}
            <button type="submit" disabled={setupPending} className={buttonPrimaryClass}>
              설정 시작
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
