/** 삭제된 댓글 표시용 placeholder */
export const DELETED_COMMENT_PLACEHOLDER = "삭제된 댓글입니다.";

export function displayCommentContent(content: string, isDeleted: boolean): string {
  return isDeleted ? DELETED_COMMENT_PLACEHOLDER : content;
}
