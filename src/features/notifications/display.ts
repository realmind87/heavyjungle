import type { NotificationItem, NotificationType } from "@/features/notifications/types";

const SYSTEM_TYPES: ReadonlySet<NotificationType> = new Set([
  "report_resolved",
  "report_dismissed",
]);

/** 시스템(운영) 알림 여부 — 행위자 이름 없이 안내 문구만 표시 */
export function isSystemNotification(type: NotificationType): boolean {
  return SYSTEM_TYPES.has(type);
}

export function getNotificationText(type: NotificationType): string {
  switch (type) {
    case "follow":
      return "회원님을 팔로우했습니다.";
    case "comment":
      return "회원님의 글에 댓글을 남겼습니다.";
    case "reply":
      return "회원님의 댓글에 답글을 남겼습니다.";
    case "like":
      return "회원님의 글을 좋아합니다.";
    case "comment_like":
      return "회원님의 댓글을 좋아합니다.";
    case "report_resolved":
      return "신고하신 내용이 검토되어 조치되었습니다.";
    case "report_dismissed":
      return "신고하신 내용이 검토되었으나 별도 조치되지 않았습니다.";
  }
}

export function getNotificationHref(item: NotificationItem): string {
  if (isSystemNotification(item.type)) return "/notifications";
  if (item.post) return `/posts/${item.post.id}`;
  return `/u/${item.actor.username}`;
}
