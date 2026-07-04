export type NotificationType =
  | "follow"
  | "comment"
  | "reply"
  | "like"
  | "comment_like"
  | "report_resolved"
  | "report_dismissed";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  actor: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  post: {
    id: string;
    title: string;
  } | null;
};
