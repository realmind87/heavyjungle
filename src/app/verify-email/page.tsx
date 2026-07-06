import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyEmailToken } from "@/server/auth/email-verification";
import { buttonPrimaryClass, pageTitleClass } from "@/lib/ui-classes";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className={pageTitleClass}>이메일 인증</h1>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">유효하지 않은 링크입니다.</p>
      </main>
    );
  }

  const result = await verifyEmailToken(token);

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className={pageTitleClass}>이메일 인증</h1>
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{result.error}</p>
        <Link href="/login/resend-verification" className={`mt-6 inline-block ${buttonPrimaryClass}`}>
          인증 메일 다시 받기
        </Link>
      </main>
    );
  }

  redirect(`/login?verified=1`);
}
