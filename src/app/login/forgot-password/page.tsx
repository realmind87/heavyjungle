import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { RecoveryForm } from "@/components/auth/recovery-form";
import { requestPasswordReset } from "@/features/auth/recovery-actions";
import { inputClass, labelClass, linkMutedClass, mutedTextClass, pageTitleClass } from "@/lib/ui-classes";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className={`mb-2 text-center ${pageTitleClass}`}>비밀번호 찾기</h1>
        <p className={`mb-6 text-center ${mutedTextClass}`}>
          가입 시 사용한 이메일로 비밀번호 재설정 링크를 보내 드립니다.
        </p>

        <RecoveryForm action={requestPasswordReset} submitLabel="재설정 링크 받기">
          <label className="block">
            <span className={labelClass}>이메일</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
        </RecoveryForm>

        <p className={`mt-6 text-center ${linkMutedClass}`}>
          <Link href="/login" className="hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </main>
    </div>
  );
}
