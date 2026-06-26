import { SiteHeader } from "@/components/layout/site-header";
import { AuthForm } from "@/components/auth/auth-form";
import { signIn } from "@/features/auth/actions";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className="mb-6 text-center text-2xl font-bold">로그인</h1>
        <AuthForm action={signIn} submitLabel="로그인" next={next}>
          <label className="block">
            <span className="mb-1 block text-sm">이메일 또는 아이디</span>
            <input name="login" type="text" required autoComplete="username" className="w-full border px-3 py-2" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">비밀번호</span>
            <input name="password" type="password" required autoComplete="current-password" className="w-full border px-3 py-2" />
          </label>
        </AuthForm>
      </main>
    </div>
  );
}
