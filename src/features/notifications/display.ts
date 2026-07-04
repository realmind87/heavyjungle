import type { NotificationItem, NotificationType } from "@/features/notifications/types";

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
  }
}

export function getNotificationHref(item: NotificationItem): string {
  if (item.post) return `/posts/${item.post.id}`;
  return `/u/${item.actor.username}`;
}
