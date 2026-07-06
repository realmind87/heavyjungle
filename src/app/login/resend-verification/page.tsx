import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import { resendVerificationEmail } from "@/features/auth/actions";
import { inputClass, labelClass, pageTitleClass } from "@/lib/ui-classes";

export default function ResendVerificationPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className={`mb-6 text-center ${pageTitleClass}`}>인증 메일 다시 받기</h1>
        <AuthForm action={resendVerificationEmail} submitLabel="메일 발송">
          <label className="block">
            <span className={labelClass}>가입 이메일</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
        </AuthForm>
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/login" className="underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </main>
    </div>
  );
}
