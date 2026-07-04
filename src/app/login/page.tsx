import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthRecoveryLinks } from "@/components/auth/auth-recovery-links";
import { signIn } from "@/features/auth/actions";
import { inputClass, labelClass, pageTitleClass, successTextClass } from "@/lib/ui-classes";

type PageProps = {
  searchParams: Promise<{ next?: string; reset?: string; email?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next, reset, email } = await searchParams;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className={`mb-6 text-center ${pageTitleClass}`}>로그인</h1>
        {reset === "success" && (
          <p className={`mb-4 text-center ${successTextClass}`}>비밀번호가 변경되었습니다. 다시 로그인해 주세요.</p>
        )}
        {email === "updated" && (
          <p className={`mb-4 text-center ${successTextClass}`}>이메일이 변경되었습니다. 새 이메일로 로그인해 주세요.</p>
        )}
        <AuthForm action={signIn} submitLabel="로그인" next={next}>
          <label className="block">
            <span className={labelClass}>이메일 또는 아이디</span>
            <input name="login" type="text" required autoComplete="username" className={inputClass} />
          </label>
          <label className="block">
            <span className={labelClass}>비밀번호</span>
            <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
          </label>
        </AuthForm>
        <AuthRecoveryLinks className="mt-4" />
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-zinc-900 underline dark:text-zinc-100">
            회원가입
          </Link>
        </p>
      </main>
    </div>
  );
}
