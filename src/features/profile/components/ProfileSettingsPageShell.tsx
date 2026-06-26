import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";

type ProfileSettingsPageShellProps = {
  username: string;
  title: string;
  children: React.ReactNode;
};

/** 프로필 설정 풀페이지 공용 레이아웃 */
export function ProfileSettingsPageShell({ username, title, children }: ProfileSettingsPageShellProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href={`/u/${username}`} className="text-sm text-zinc-500 hover:underline">
          ← 프로필
        </Link>
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
