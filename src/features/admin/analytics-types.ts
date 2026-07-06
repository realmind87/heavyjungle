export type DailyCount = {
  day: string;
  count: number;
};

export type KpiMetric = {
  total: number;
  today: number;
  thisWeek: number;
};

export type TopPostMetric = {
  id: string;
  title: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  authorUsername: string;
};

export type TopAuthorMetric = {
  id: string;
  username: string;
  displayName: string | null;
  postCount: number;
};

export type LabelCount = {
  label: string;
  count: number;
};

export type AuditLogSummary = {
  id: string;
  action: string;
  targetLabel: string | null;
  actorUsername: string;
  createdAt: string;
};

export type AdminAnalyticsDashboard = {
  kpi: {
    users: KpiMetric;
    posts: KpiMetric;
    comments: KpiMetric;
    pendingReports: number;
  };
  trends: {
    signups: DailyCount[];
    posts: DailyCount[];
    comments: DailyCount[];
    activeUsers: DailyCount[];
  };
  content: {
    topPostsByViews: TopPostMetric[];
    topPostsByLikes: TopPostMetric[];
    categoryDistribution: LabelCount[];
    avgCommentsPerPost: number;
    avgLikesPerPost: number;
  };
  users: {
    topAuthors: TopAuthorMetric[];
    usersWithoutPostsRatio: number;
    totalFollows: number;
    avgFollowersPerUser: number;
  };
  operations: {
    reportsByReason: LabelCount[];
    reportsByStatus: LabelCount[];
    avgResolutionHours: number | null;
    resolveRatio: number;
    recentAuditLogs: AuditLogSummary[];
  };
};

export type UmamiDashboardStats = {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totalTime: number;
};

export type UmamiMetricRow = {
  label: string;
  count: number;
};

export type UmamiAnalyticsSection = {
  stats: UmamiDashboardStats | null;
  topPages: UmamiMetricRow[];
  referrers: UmamiMetricRow[];
  devices: UmamiMetricRow[];
  error: string | null;
};
