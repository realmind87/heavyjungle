export type ReportTargetType = "post" | "comment";
export type ReportReason = "spam" | "abuse" | "illegal" | "other";
export type ReportStatus = "pending" | "resolved" | "dismissed";

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  spam: "스팸/광고",
  abuse: "욕설/혐오",
  illegal: "불법 정보",
  other: "기타",
};
