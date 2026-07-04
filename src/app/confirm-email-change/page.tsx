import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { ConfirmEmailChangeForm } from "@/features/profile/components/ConfirmEmailChangeForm";
import { linkMutedClass, mutedTextClass, pageTitleClass } from "@/lib/ui-classes";

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ConfirmEmailChangePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <h1 className={`mb-2 text-center ${pageTitleClass}`}>이메일 변경 확인</h1>
        <p className={`mb-6 text-center ${mutedTextClass}`}>
          아래 버튼을 눌러 새 이메일 주소로의 변경을 완료하세요.
        </p>

        {!token ? (
          <p className={`text-center ${mutedTextClass}`}>
            유효하지 않은 링크입니다. 프로필 설정에서 이메일 변경을 다시 요청해 주세요.
          </p>
        ) : (
          <ConfirmEmailChangeForm token={token} />
        )}

        <p className={`mt-6 text-center ${linkMutedClass}`}>
          <Link href="/" className="hover:underline">
            홈으로
          </Link>
        </p>
      </main>
    </div>
  );
}
