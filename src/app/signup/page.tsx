import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import { SignUpPasswordFields } from "@/components/auth/signup-password-fields";
import { signUp } from "@/features/auth/actions";
import { inputClass, labelClass, pageTitleClass } from "@/lib/ui-classes";

export default function SignUpPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className={`mb-6 text-center ${pageTitleClass}`}>회원가입</h1>
      <AuthForm action={signUp} submitLabel="회원가입">
        <label className="block">
          <span className={labelClass}>아이디</span>
          <input name="username" type="text" required autoComplete="username" className={inputClass} />
        </label>
        <label className="block">
          <span className={labelClass}>이메일</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <SignUpPasswordFields />
      </AuthForm>
      <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-zinc-900 underline dark:text-zinc-100">
          로그인
        </Link>
      </p>
    </main>
    </div>
  );
}
