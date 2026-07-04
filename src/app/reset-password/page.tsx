import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { RecoveryForm } from "@/components/auth/recovery-form";
import { resetPassword } from "@/features/auth/recovery-actions";
import { inputClass, labelClass, linkMutedClass, mutedTextClass, pageTitleClass } from "@/lib/ui-classes";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className={`mb-2 text-center ${pageTitleClass}`}>비밀번호 재설정</h1>
        <p className={`mb-6 text-center ${mutedTextClass}`}>새 비밀번호를 입력해 주세요.</p>

        {!token ? (
          <p className={`text-center ${mutedTextClass}`}>
            유효하지 않은 링크입니다.{" "}
            <Link href="/login/forgot-password" className="underline">
              비밀번호 찾기
            </Link>
            를 다시 시도해 주세요.
          </p>
        ) : (
          <RecoveryForm action={resetPassword} submitLabel="비밀번호 변경">
            <input type="hidden" name="token" value={token} />
            <label className="block">
              <span className={labelClass}>새 비밀번호</span>
              <input
                name="password"
                type="password"
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>비밀번호 확인</span>
              <input
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className={inputClass}
              />
            </label>
          </RecoveryForm>
        )}

        <p className={`mt-6 text-center ${linkMutedClass}`}>
          <Link href="/login" className="hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </main>
    </div>
  );
}
