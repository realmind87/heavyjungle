"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdminAnalyticsDashboard, KpiMetric, UmamiAnalyticsSection } from "@/features/admin/analytics-types";
import { formatDayLabel } from "@/features/admin/analytics-utils";
import { linkMutedClass, sectionTitleClass } from "@/lib/ui-classes";

type AdminDashboardProps = {
  analytics: AdminAnalyticsDashboard;
  umami: UmamiAnalyticsSection;
};

type DashboardTabId = "overview" | "content" | "users" | "operations" | "visitors";

const DASHBOARD_TABS: Array<{ id: DashboardTabId; label: string }> = [
  { id: "overview", label: "개요" },
  { id: "content", label: "콘텐츠" },
  { id: "users", label: "사용자" },
  { id: "operations", label: "운영" },
  { id: "visitors", label: "방문자" },
];

function DashboardTabs({
  value,
  onChange,
  pendingReports,
}: {
  value: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
  pendingReports: number;
}) {
  return (
    <div
      role="tablist"
      aria-label="대시보드 영역"
      className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900/50"
    >
      {DASHBOARD_TABS.map((tab) => {
        const isActive = value === tab.id;
        const showBadge = tab.id === "operations" && pendingReports > 0;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`dashboard-panel-${tab.id}`}
            id={`dashboard-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {tab.label}
            {showBadge ? (
              <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {pendingReports > 99 ? "99+" : pendingReports}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function TabPanel({
  id,
  labelledBy,
  hidden,
  children,
}: {
  id: DashboardTabId;
  labelledBy: string;
  hidden: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`dashboard-panel-${id}`}
      aria-labelledby={labelledBy}
      hidden={hidden}
      className={hidden ? undefined : "space-y-6"}
    >
      {children}
    </div>
  );
}

function KpiCard({ title, metric }: { title: string; metric: KpiMetric }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{metric.total.toLocaleString()}</p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        오늘 +{metric.today} · 이번 주 +{metric.thisWeek}
      </p>
    </div>
  );
}

function SimpleKpiCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value.toLocaleString()}</p>
    </div>
  );
}

function DistributionChart({ title, data }: { title: string; data: Array<{ label: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h3 className={sectionTitleClass}>{title}</h3>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className={sectionTitleClass}>{title}</h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="count" name="건수" fill="#3f3f46" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AdminDashboard({ analytics, umami }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTabId>("overview");

  const trendSeries = analytics.trends.signups.map((row, index) => ({
    day: row.day,
    signups: row.count,
    posts: analytics.trends.posts[index]?.count ?? 0,
    comments: analytics.trends.comments[index]?.count ?? 0,
    activeUsers: analytics.trends.activeUsers[index]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <DashboardTabs
        value={activeTab}
        onChange={setActiveTab}
        pendingReports={analytics.kpi.pendingReports}
      />

      <TabPanel id="overview" labelledBy="dashboard-tab-overview" hidden={activeTab !== "overview"}>
        <section>
          <h2 className={sectionTitleClass}>운영 KPI</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="회원" metric={analytics.kpi.users} />
            <KpiCard title="게시글" metric={analytics.kpi.posts} />
            <KpiCard title="댓글" metric={analytics.kpi.comments} />
            <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">미처리 신고</p>
              <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                {analytics.kpi.pendingReports.toLocaleString()}
              </p>
              <Link href="/admin" className={`mt-2 inline-block ${linkMutedClass}`}>
                신고함으로 →
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className={sectionTitleClass}>커뮤니티 추이 (30일)</h3>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendSeries}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                  <XAxis dataKey="day" tickFormatter={formatDayLabel} fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip labelFormatter={(label) => String(label)} />
                  <Legend />
                  <Line type="monotone" dataKey="signups" name="가입" stroke="#2563eb" dot={false} />
                  <Line type="monotone" dataKey="posts" name="글" stroke="#16a34a" dot={false} />
                  <Line type="monotone" dataKey="comments" name="댓글" stroke="#ca8a04" dot={false} />
                  <Line type="monotone" dataKey="activeUsers" name="활동 유저" stroke="#9333ea" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            활동 유저는 해당 일에 글·댓글·좋아요를 남긴 고유 회원 수(근사치)입니다.
          </p>
        </section>
      </TabPanel>

      <TabPanel id="content" labelledBy="dashboard-tab-content" hidden={activeTab !== "content"}>
        <section className="grid gap-4 lg:grid-cols-2">
          <DistributionChart title="게시글 분류" data={analytics.content.categoryDistribution} />
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className={sectionTitleClass}>콘텐츠 요약</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">글당 평균 댓글</dt>
                <dd className="font-medium">{analytics.content.avgCommentsPerPost}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">글당 평균 좋아요</dt>
                <dd className="font-medium">{analytics.content.avgLikesPerPost}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className={sectionTitleClass}>조회수 TOP 10</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {analytics.content.topPostsByViews.map((post) => (
                <li key={post.id} className="flex items-start justify-between gap-2">
                  <Link href={`/posts/${post.id}`} className="line-clamp-1 hover:underline">
                    {post.title}
                  </Link>
                  <span className="shrink-0 text-zinc-500">{post.viewCount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </TabPanel>

      <TabPanel id="users" labelledBy="dashboard-tab-users" hidden={activeTab !== "users"}>
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className={sectionTitleClass}>사용자 지표</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">총 회원</dt>
                <dd className="font-medium">{analytics.kpi.users.total.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">글 미작성 회원 비율</dt>
                <dd className="font-medium">{analytics.users.usersWithoutPostsRatio}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">총 팔로우</dt>
                <dd className="font-medium">{analytics.users.totalFollows.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">평균 팔로워</dt>
                <dd className="font-medium">{analytics.users.avgFollowersPerUser}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className={sectionTitleClass}>활발한 작성자 TOP 10</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {analytics.users.topAuthors.map((author) => (
                <li key={author.id} className="flex justify-between gap-2">
                  <Link href={`/u/${author.username}`} className="hover:underline">
                    {author.displayName ?? author.username}
                  </Link>
                  <span className="text-zinc-500">{author.postCount}글</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </TabPanel>

      <TabPanel id="operations" labelledBy="dashboard-tab-operations" hidden={activeTab !== "operations"}>
        <section className="grid gap-4 lg:grid-cols-2">
          <DistributionChart title="신고 사유" data={analytics.operations.reportsByReason} />
          <DistributionChart title="신고 상태" data={analytics.operations.reportsByStatus} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className={sectionTitleClass}>신고 처리</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">미처리 신고</dt>
                <dd className="font-medium text-red-600 dark:text-red-400">
                  {analytics.kpi.pendingReports.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">평균 신고 처리 시간</dt>
                <dd className="font-medium">
                  {analytics.operations.avgResolutionHours != null
                    ? `${analytics.operations.avgResolutionHours}시간`
                    : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">신고 삭제 처리 비율</dt>
                <dd className="font-medium">{analytics.operations.resolveRatio}%</dd>
              </div>
            </dl>
            <Link href="/admin" className={`mt-4 inline-block ${linkMutedClass}`}>
              모더레이션 패널 →
            </Link>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className={sectionTitleClass}>최근 감사 로그</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {analytics.operations.recentAuditLogs.map((log) => (
                <li key={log.id} className="border-b border-zinc-100 pb-2 last:border-0 dark:border-zinc-800">
                  <p className="font-medium">{log.action}</p>
                  <p className="text-xs text-zinc-500">
                    {log.actorUsername} · {log.targetLabel ?? "-"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </TabPanel>

      <TabPanel id="visitors" labelledBy="dashboard-tab-visitors" hidden={activeTab !== "visitors"}>
        <section>
          <h2 className={sectionTitleClass}>방문자 분석 (Umami)</h2>
          {umami.error ? (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{umami.error}</p>
          ) : !umami.stats ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Umami가 설정되지 않았습니다. 환경 변수를 추가하면 방문자 통계가 표시됩니다.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SimpleKpiCard title="순 방문자 (30일)" value={umami.stats.visitors} />
                <SimpleKpiCard title="페이지뷰 (30일)" value={umami.stats.pageviews} />
                <SimpleKpiCard title="방문 수 (30일)" value={umami.stats.visits} />
                <SimpleKpiCard title="이탈 (30일)" value={umami.stats.bounces} />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <DistributionChart title="인기 페이지" data={umami.topPages} />
                <DistributionChart title="유입 경로" data={umami.referrers} />
                <DistributionChart title="기기" data={umami.devices} />
              </div>
            </div>
          )}
        </section>
      </TabPanel>
    </div>
  );
}
