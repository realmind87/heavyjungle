import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/features/auth/actions";
import { inputClass, labelClass, pageTitleClass } from "@/lib/ui-classes";

export default function SignUpPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
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
        <label className="block">
          <span className={labelClass}>비밀번호</span>
          <input name="password" type="password" required autoComplete="new-password" className={inputClass} />
        </label>
      </AuthForm>
    </main>
    </div>
  );
}
