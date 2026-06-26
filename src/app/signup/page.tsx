import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import { signUp } from "@/features/auth/actions";

export default function SignUpPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">회원가입</h1>
      <AuthForm action={signUp} submitLabel="회원가입">
        <label className="block">
          <span className="mb-1 block text-sm">아이디</span>
          <input name="username" type="text" required autoComplete="username" className="w-full border px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">이메일</span>
          <input name="email" type="email" required autoComplete="email" className="w-full border px-3 py-2" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm">비밀번호</span>
          <input name="password" type="password" required autoComplete="new-password" className="w-full border px-3 py-2" />
        </label>
      </AuthForm>
    </main>
    </div>
  );
}
