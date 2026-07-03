import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { PostCard } from "@/features/posts/components/post-card";
import { listNoticePosts } from "@/features/posts/queries";
import { linkMutedClass, mutedTextClass, outlineChipClass, pageTitleClass } from "@/lib/ui-classes";

type PageProps = {
  searchParams: Promise<{ cursor?: string }>;
};

export default async function NoticesPage({ searchParams }: PageProps) {
  const { cursor } = await searchParams;
  const noticesPage = await listNoticePosts({ cursor, limit: 20 });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/" className={linkMutedClass}>
          ← 홈
        </Link>
        <h1 className={`mt-4 ${pageTitleClass}`}>공지사항</h1>
        <p className={`mt-1 ${mutedTextClass}`}>커뮤니티 공지와 안내를 확인하세요.</p>

        <section className="mt-8">
          {noticesPage.items.length === 0 ? (
            <p className={`py-12 text-center ${mutedTextClass}`}>등록된 공지사항이 없습니다.</p>
          ) : (
            <div>
              {noticesPage.items.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {noticesPage.nextCursor && (
            <div className="py-6 text-center">
              <Link
                href={`/notices?cursor=${encodeURIComponent(noticesPage.nextCursor)}`}
                className={outlineChipClass}
              >
                더 보기
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
