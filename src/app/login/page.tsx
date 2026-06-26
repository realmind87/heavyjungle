import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/features/auth/actions";
import { inputClass, labelClass, pageTitleClass } from "@/lib/ui-classes";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className={`mb-6 text-center ${pageTitleClass}`}>로그인</h1>
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
      </main>
    </div>
  );
}
