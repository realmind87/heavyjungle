/**
 * 관리자 운영 지표 집계 — server-only, Redis 캐시(5분).
 */
import "server-only";

import { sql } from "drizzle-orm";
import { fillDailySeries } from "@/features/admin/analytics-utils";
import type {
  AdminAnalyticsDashboard,
  AuditLogSummary,
  DailyCount,
  KpiMetric,
  LabelCount,
  TopAuthorMetric,
  TopPostMetric,
} from "@/features/admin/analytics-types";
import { listAdminAuditLogs } from "@/features/admin/audit-log";
import { REPORT_REASON_LABEL } from "@/features/reports/types";
import { cacheGet, cacheKey, cacheSet } from "@/lib/cache";
import { db } from "@/server/db";

const ANALYTICS_CACHE_TTL_SECONDS = 300;
const TREND_SINCE = sql`now() - interval '30 days'`;

type CountRow = { count: number };
type DayCountRow = { day: string; count: number };
type LabelCountRow = { label: string; count: number };

async function countKpi(table: "users" | "posts" | "comments", deletedColumn?: string): Promise<KpiMetric> {
  const deletedFilter = deletedColumn ? sql`AND NOT ${sql.raw(deletedColumn)}` : sql``;

  const [totalRow] = await db.execute<CountRow>(sql`
    SELECT count(*)::int AS count FROM ${sql.raw(table)}
    WHERE true ${deletedFilter}
  `);
  const [todayRow] = await db.execute<CountRow>(sql`
    SELECT count(*)::int AS count FROM ${sql.raw(table)}
    WHERE created_at >= date_trunc('day', now()) ${deletedFilter}
  `);
  const [weekRow] = await db.execute<CountRow>(sql`
    SELECT count(*)::int AS count FROM ${sql.raw(table)}
    WHERE created_at >= date_trunc('week', now()) ${deletedFilter}
  `);

  return {
    total: totalRow?.count ?? 0,
    today: todayRow?.count ?? 0,
    thisWeek: weekRow?.count ?? 0,
  };
}

async function dailyCounts(table: "users" | "posts" | "comments", deletedColumn?: string): Promise<DailyCount[]> {
  const deletedFilter = deletedColumn ? sql`AND NOT ${sql.raw(deletedColumn)}` : sql``;

  const rows = await db.execute<DayCountRow>(sql`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
           count(*)::int AS count
    FROM ${sql.raw(table)}
    WHERE created_at >= ${TREND_SINCE}
    ${deletedFilter}
    GROUP BY 1
    ORDER BY 1
  `);

  return fillDailySeries(rows, 30);
}

async function dailyActiveUsers(): Promise<DailyCount[]> {
  const rows = await db.execute<DayCountRow>(sql`
    WITH activity AS (
      SELECT date_trunc('day', created_at) AS day, author_id AS user_id
      FROM posts
      WHERE created_at >= ${TREND_SINCE} AND NOT is_deleted
      UNION ALL
      SELECT date_trunc('day', created_at), author_id
      FROM comments
      WHERE created_at >= ${TREND_SINCE} AND NOT is_deleted
      UNION ALL
      SELECT date_trunc('day', created_at), user_id
      FROM likes
      WHERE created_at >= ${TREND_SINCE}
      UNION ALL
      SELECT date_trunc('day', created_at), user_id
      FROM comment_likes
      WHERE created_at >= ${TREND_SINCE}
    )
    SELECT to_char(day, 'YYYY-MM-DD') AS day, count(DISTINCT user_id)::int AS count
    FROM activity
    GROUP BY day
    ORDER BY day
  `);

  return fillDailySeries(rows, 30);
}

async function pendingReportCount(): Promise<number> {
  const [row] = await db.execute<CountRow>(sql`
    SELECT count(*)::int AS count FROM reports WHERE status = 'pending'
  `);
  return row?.count ?? 0;
}

async function topPosts(orderColumn: "view_count" | "like_count" | "comment_count"): Promise<TopPostMetric[]> {
  const rows = await db.execute<{
    id: string;
    title: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    author_username: string;
  }>(sql`
    SELECT p.id,
           p.title,
           p.view_count,
           p.like_count,
           p.comment_count,
           u.username AS author_username
    FROM posts p
    INNER JOIN users u ON u.id = p.author_id
    WHERE NOT p.is_deleted
    ORDER BY p.${sql.raw(orderColumn)} DESC, p.created_at DESC
    LIMIT 10
  `);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    viewCount: row.view_count,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    authorUsername: row.author_username,
  }));
}

async function categoryDistribution(): Promise<LabelCount[]> {
  const rows = await db.execute<LabelCountRow>(sql`
    SELECT category::text AS label, count(*)::int AS count
    FROM posts
    WHERE NOT is_deleted
    GROUP BY category
    ORDER BY count DESC
  `);

  return rows.map((row) => ({
    label: row.label === "notice" ? "공지" : "일반",
    count: row.count,
  }));
}

async function postAverages(): Promise<{ avgCommentsPerPost: number; avgLikesPerPost: number }> {
  const [row] = await db.execute<{ avg_comments: number; avg_likes: number }>(sql`
    SELECT coalesce(avg(comment_count), 0)::float AS avg_comments,
           coalesce(avg(like_count), 0)::float AS avg_likes
    FROM posts
    WHERE NOT is_deleted
  `);

  return {
    avgCommentsPerPost: Math.round((row?.avg_comments ?? 0) * 10) / 10,
    avgLikesPerPost: Math.round((row?.avg_likes ?? 0) * 10) / 10,
  };
}

async function topAuthors(): Promise<TopAuthorMetric[]> {
  const rows = await db.execute<{
    id: string;
    username: string;
    display_name: string | null;
    post_count: number;
  }>(sql`
    SELECT u.id,
           u.username,
           u.display_name,
           count(p.id)::int AS post_count
    FROM users u
    INNER JOIN posts p ON p.author_id = u.id AND NOT p.is_deleted
    GROUP BY u.id, u.username, u.display_name
    ORDER BY post_count DESC, u.username ASC
    LIMIT 10
  `);

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    postCount: row.post_count,
  }));
}

async function usersWithoutPostsRatio(): Promise<number> {
  const [row] = await db.execute<{ ratio: number }>(sql`
    SELECT CASE WHEN count(*) = 0 THEN 0
           ELSE round(
             count(*) FILTER (
               WHERE id NOT IN (
                 SELECT DISTINCT author_id FROM posts WHERE NOT is_deleted
               )
             )::numeric / count(*)::numeric * 100,
             1
           )::float
           END AS ratio
    FROM users
  `);
  return row?.ratio ?? 0;
}

async function followStats(): Promise<{ totalFollows: number; avgFollowersPerUser: number }> {
  const [totals] = await db.execute<CountRow>(sql`SELECT count(*)::int AS count FROM follows`);
  const [avgRow] = await db.execute<{ avg_followers: number }>(sql`
    SELECT coalesce(avg(cnt), 0)::float AS avg_followers
    FROM (
      SELECT count(*)::int AS cnt
      FROM follows
      GROUP BY following_id
    ) sub
  `);

  return {
    totalFollows: totals?.count ?? 0,
    avgFollowersPerUser: Math.round((avgRow?.avg_followers ?? 0) * 10) / 10,
  };
}

async function reportsByReason(): Promise<LabelCount[]> {
  const rows = await db.execute<LabelCountRow>(sql`
    SELECT reason::text AS label, count(*)::int AS count
    FROM reports
    GROUP BY reason
    ORDER BY count DESC
  `);

  return rows.map((row) => ({
    label: REPORT_REASON_LABEL[row.label as keyof typeof REPORT_REASON_LABEL] ?? row.label,
    count: row.count,
  }));
}

async function reportsByStatus(): Promise<LabelCount[]> {
  const rows = await db.execute<LabelCountRow>(sql`
    SELECT status::text AS label, count(*)::int AS count
    FROM reports
    GROUP BY status
    ORDER BY count DESC
  `);

  const statusLabel: Record<string, string> = {
    pending: "대기",
    resolved: "처리(삭제)",
    dismissed: "기각",
  };

  return rows.map((row) => ({
    label: statusLabel[row.label] ?? row.label,
    count: row.count,
  }));
}

async function avgReportResolutionHours(): Promise<number | null> {
  const [row] = await db.execute<{ hours: number | null }>(sql`
    SELECT round(avg(extract(epoch FROM (resolved_at - created_at)) / 3600)::numeric, 1)::float AS hours
    FROM reports
    WHERE resolved_at IS NOT NULL
  `);
  return row?.hours ?? null;
}

async function reportResolveRatio(): Promise<number> {
  const [row] = await db.execute<{ ratio: number }>(sql`
    SELECT CASE WHEN count(*) FILTER (WHERE status IN ('resolved', 'dismissed')) = 0 THEN 0
           ELSE round(
             count(*) FILTER (WHERE status = 'resolved')::numeric
             / count(*) FILTER (WHERE status IN ('resolved', 'dismissed'))::numeric * 100,
             1
           )::float
           END AS ratio
    FROM reports
  `);
  return row?.ratio ?? 0;
}

const AUDIT_ACTION_LABEL: Record<string, string> = {
  notice_create: "공지 등록",
  notice_update: "공지 수정",
  post_delete: "글 강제 삭제",
  comment_delete: "댓글 강제 삭제",
  role_change: "권한 변경",
  report_resolve: "신고 처리 (삭제)",
  report_dismiss: "신고 기각",
};

async function recentAuditLogSummaries(): Promise<AuditLogSummary[]> {
  const logs = await listAdminAuditLogs();
  return logs.slice(0, 10).map((log) => ({
    id: log.id,
    action: AUDIT_ACTION_LABEL[log.action] ?? log.action,
    targetLabel: log.targetLabel,
    actorUsername: log.actor.username,
    createdAt: log.createdAt.toISOString(),
  }));
}

async function fetchAdminAnalyticsDashboard(): Promise<AdminAnalyticsDashboard> {
  const [
    usersKpi,
    postsKpi,
    commentsKpi,
    pendingReports,
    signups,
    postTrend,
    commentTrend,
    activeUsers,
    topPostsByViews,
    topPostsByLikes,
    categoryDistributionRows,
    averages,
    topAuthorsRows,
    withoutPostsRatio,
    follows,
    reasonRows,
    statusRows,
    resolutionHours,
    resolveRatio,
    auditLogs,
  ] = await Promise.all([
    countKpi("users"),
    countKpi("posts", "is_deleted"),
    countKpi("comments", "is_deleted"),
    pendingReportCount(),
    dailyCounts("users"),
    dailyCounts("posts", "is_deleted"),
    dailyCounts("comments", "is_deleted"),
    dailyActiveUsers(),
    topPosts("view_count"),
    topPosts("like_count"),
    categoryDistribution(),
    postAverages(),
    topAuthors(),
    usersWithoutPostsRatio(),
    followStats(),
    reportsByReason(),
    reportsByStatus(),
    avgReportResolutionHours(),
    reportResolveRatio(),
    recentAuditLogSummaries(),
  ]);

  return {
    kpi: {
      users: usersKpi,
      posts: postsKpi,
      comments: commentsKpi,
      pendingReports,
    },
    trends: {
      signups,
      posts: postTrend,
      comments: commentTrend,
      activeUsers,
    },
    content: {
      topPostsByViews,
      topPostsByLikes,
      categoryDistribution: categoryDistributionRows,
      avgCommentsPerPost: averages.avgCommentsPerPost,
      avgLikesPerPost: averages.avgLikesPerPost,
    },
    users: {
      topAuthors: topAuthorsRows,
      usersWithoutPostsRatio: withoutPostsRatio,
      totalFollows: follows.totalFollows,
      avgFollowersPerUser: follows.avgFollowersPerUser,
    },
    operations: {
      reportsByReason: reasonRows,
      reportsByStatus: statusRows,
      avgResolutionHours: resolutionHours,
      resolveRatio,
      recentAuditLogs: auditLogs,
    },
  };
}

export async function getAdminAnalyticsDashboard(): Promise<AdminAnalyticsDashboard> {
  const key = cacheKey("admin", "analytics", "dashboard");
  const cached = await cacheGet<AdminAnalyticsDashboard>(key);
  if (cached) return cached;

  const data = await fetchAdminAnalyticsDashboard();
  await cacheSet(key, data, ANALYTICS_CACHE_TTL_SECONDS);
  return data;
}
