import { SiteHeader } from "@/components/layout/site-header";
import { pageTitleClass, sectionTitleClass } from "@/lib/ui-classes";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-12">
        <h1 className={pageTitleClass}>개인정보처리방침</h1>
        <section className="mt-8 space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <h2 className={sectionTitleClass}>방문 통계 수집</h2>
          <p>
            Heavy Jungle은 서비스 이용 현황을 파악하기 위해 <strong>Umami</strong> 기반 방문 통계를 수집할 수
            있습니다. 쿠키를 사용하며, 개인을 식별하지 않는 형태(페이지뷰, 유입 경로, 기기 유형 등)로
            집계됩니다.
          </p>
          <p>
            Umami는 셀프호스팅되며, 통계 데이터는 운영자가 관리하는 서버에 저장됩니다. 브라우저에서 추적을
            거부하려면 광고 차단 확장 프로그램 등을 사용할 수 있습니다.
          </p>
          <h2 className={sectionTitleClass}>문의</h2>
          <p>개인정보 관련 문의는 사이트 관리자에게 연락해 주세요.</p>
        </section>
      </main>
    </div>
  );
}
