"use client";

import { useActionState, useState } from "react";
import {
  adminDeleteComment,
  adminDeletePost,
  setUserRole,
  type AdminActionState,
} from "@/features/admin/actions";
import type { AdminAuditLogListItem } from "@/features/admin/audit-log";
import type {
  AdminCommentListItem,
  AdminPostListItem,
  AdminUserListItem,
} from "@/features/admin/queries";
import {
  dismissReport,
  resolveReportAndRemoveTarget,
  type ReportAdminActionState,
} from "@/features/reports/admin-actions";
import type { AdminReportListItem } from "@/features/reports/queries";
import { REPORT_REASON_LABEL } from "@/features/reports/types";
import { buttonDangerClass, buttonSecondaryClass, errorTextClass } from "@/lib/ui-classes";

type AdminTab = "posts" | "comments" | "users" | "reports" | "audit-log";

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: "posts", label: "최신 글" },
  { id: "comments", label: "최신 댓글" },
  { id: "users", label: "사용자" },
  { id: "reports", label: "신고" },
  { id: "audit-log", label: "감사 로그" },
];

function DashboardLink() {
  return (
    <a
      href="/admin/dashboard"
      className="relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
    >
      대시보드
    </a>
  );
}

const AUDIT_ACTION_LABEL: Record<AdminAuditLogListItem["action"], string> = {
  notice_create: "공지 등록",
  notice_update: "공지 수정",
  post_delete: "글 강제 삭제",
  comment_delete: "댓글 강제 삭제",
  role_change: "권한 변경",
  report_resolve: "신고 처리 (삭제)",
  report_dismiss: "신고 기각",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function truncate(text: string, maxLength: number) {
  const plain = text.replace(/<[^>]+>/g, "").trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength)}…`;
}

function DeletePostButton({ postId }: { postId: string }) {
  const [state, formAction, pending] = useActionState(adminDeletePost, {} as AdminActionState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="postId" value={postId} />
      {state.error && <p className={`mb-1 ${errorTextClass}`}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonDangerClass}>
        {pending ? "삭제 중..." : "삭제"}
      </button>
    </form>
  );
}

function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [state, formAction, pending] = useActionState(adminDeleteComment, {} as AdminActionState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="commentId" value={commentId} />
      {state.error && <p className={`mb-1 ${errorTextClass}`}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonDangerClass}>
        {pending ? "삭제 중..." : "삭제"}
      </button>
    </form>
  );
}

function UserRoleForm({ user, currentUserId }: { user: AdminUserListItem; currentUserId: string }) {
  const [state, formAction, pending] = useActionState(setUserRole, {} as AdminActionState);
  const isSelf = user.id === currentUserId;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={user.id} />
      <select
        name="role"
        defaultValue={user.role}
        disabled={pending || isSelf}
        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <option value="user">일반</option>
        <option value="admin">관리자</option>
      </select>
      <button type="submit" disabled={pending || isSelf} className={buttonSecondaryClass}>
        {pending ? "저장 중..." : "저장"}
      </button>
      {state.error && <p className={errorTextClass}>{state.error}</p>}
      {isSelf && <span className="text-xs text-zinc-500 dark:text-zinc-400">본인</span>}
    </form>
  );
}

function PostsTable({ posts }: { posts: AdminPostListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full text-sm text-zinc-900 dark:text-zinc-100">
        <thead className="bg-zinc-50 text-left text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <tr>
            <th className="px-3 py-2 font-medium">제목</th>
            <th className="px-3 py-2 font-medium">작성자</th>
            <th className="px-3 py-2 font-medium">작성일</th>
            <th className="px-3 py-2 font-medium">상태</th>
            <th className="px-3 py-2 font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-zinc-500 dark:text-zinc-400">
                글이 없습니다.
              </td>
            </tr>
          ) : (
            posts.map((post) => (
              <tr key={post.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2">
                  <a href={`/posts/${post.id}`} className="hover:underline">
                    {post.title}
                  </a>
                </td>
                <td className="px-3 py-2">{post.author.username}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(post.createdAt)}</td>
                <td className="px-3 py-2">{post.isDeleted ? "삭제됨" : "게시"}</td>
                <td className="px-3 py-2">
                  {!post.isDeleted && <DeletePostButton postId={post.id} />}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function CommentsTable({ comments }: { comments: AdminCommentListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full text-sm text-zinc-900 dark:text-zinc-100">
        <thead className="bg-zinc-50 text-left text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <tr>
            <th className="px-3 py-2 font-medium">내용</th>
            <th className="px-3 py-2 font-medium">작성자</th>
            <th className="px-3 py-2 font-medium">작성일</th>
            <th className="px-3 py-2 font-medium">상태</th>
            <th className="px-3 py-2 font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {comments.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-zinc-500 dark:text-zinc-400">
                댓글이 없습니다.
              </td>
            </tr>
          ) : (
            comments.map((comment) => (
              <tr key={comment.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="max-w-xs px-3 py-2">
                  <a href={`/posts/${comment.postId}`} className="hover:underline">
                    {truncate(comment.content, 80)}
                  </a>
                </td>
                <td className="px-3 py-2">{comment.author.username}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(comment.createdAt)}</td>
                <td className="px-3 py-2">{comment.isDeleted ? "삭제됨" : "게시"}</td>
                <td className="px-3 py-2">
                  {!comment.isDeleted && <DeleteCommentButton commentId={comment.id} />}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUserListItem[];
  currentUserId: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full text-sm text-zinc-900 dark:text-zinc-100">
        <thead className="bg-zinc-50 text-left text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <tr>
            <th className="px-3 py-2 font-medium">아이디</th>
            <th className="px-3 py-2 font-medium">이메일</th>
            <th className="px-3 py-2 font-medium">가입일</th>
            <th className="px-3 py-2 font-medium">권한</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-zinc-500 dark:text-zinc-400">
                사용자가 없습니다.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2">{user.username}</td>
                <td className="px-3 py-2">{user.email}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                <td className="px-3 py-2">
                  <UserRoleForm user={user} currentUserId={currentUserId} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ResolveReportButton({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(
    resolveReportAndRemoveTarget,
    {} as ReportAdminActionState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="reportId" value={reportId} />
      {state.error && <p className={`mb-1 ${errorTextClass}`}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonDangerClass}>
        {pending ? "처리 중..." : "삭제 처리"}
      </button>
    </form>
  );
}

function DismissReportButton({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState(dismissReport, {} as ReportAdminActionState);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="reportId" value={reportId} />
      {state.error && <p className={`mb-1 ${errorTextClass}`}>{state.error}</p>}
      <button type="submit" disabled={pending} className={buttonSecondaryClass}>
        {pending ? "처리 중..." : "기각"}
      </button>
    </form>
  );
}

const REPORT_STATUS_LABEL: Record<AdminReportListItem["status"], string> = {
  pending: "대기 중",
  resolved: "삭제 처리됨",
  dismissed: "기각됨",
};

function ReportsTable({ reports }: { reports: AdminReportListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full text-sm text-zinc-900 dark:text-zinc-100">
        <thead className="bg-zinc-50 text-left text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <tr>
            <th className="px-3 py-2 font-medium">대상</th>
            <th className="px-3 py-2 font-medium">사유</th>
            <th className="px-3 py-2 font-medium">신고자</th>
            <th className="px-3 py-2 font-medium">시각</th>
            <th className="px-3 py-2 font-medium">상태</th>
            <th className="px-3 py-2 font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-zinc-500 dark:text-zinc-400">
                신고 내역이 없습니다.
              </td>
            </tr>
          ) : (
            reports.map((report) => (
              <tr key={report.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="max-w-xs px-3 py-2">
                  {report.post && (
                    <a href={`/posts/${report.post.id}`} className="hover:underline">
                      [글] {report.post.title}
                    </a>
                  )}
                  {report.comment && (
                    <a href={`/posts/${report.comment.postId}`} className="hover:underline">
                      [댓글] {truncate(report.comment.content, 60)}
                    </a>
                  )}
                  {report.detail && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{report.detail}</p>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{REPORT_REASON_LABEL[report.reason]}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {report.source === "system" ? (
                    <span className="text-amber-700 dark:text-amber-400">시스템</span>
                  ) : (
                    report.reporter?.username ?? "—"
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(report.createdAt)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{REPORT_STATUS_LABEL[report.status]}</td>
                <td className="px-3 py-2">
                  {report.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <ResolveReportButton reportId={report.id} />
                      <DismissReportButton reportId={report.id} />
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function AuditLogTable({ logs }: { logs: AdminAuditLogListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="min-w-full text-sm text-zinc-900 dark:text-zinc-100">
        <thead className="bg-zinc-50 text-left text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <tr>
            <th className="px-3 py-2 font-medium">조치</th>
            <th className="px-3 py-2 font-medium">대상</th>
            <th className="px-3 py-2 font-medium">관리자</th>
            <th className="px-3 py-2 font-medium">시각</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-8 text-center text-zinc-500 dark:text-zinc-400">
                기록이 없습니다.
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-3 py-2 whitespace-nowrap">{AUDIT_ACTION_LABEL[log.action]}</td>
                <td className="max-w-xs px-3 py-2">
                  {log.targetId && log.action.startsWith("notice") ? (
                    <a href={`/posts/${log.targetId}`} className="hover:underline">
                      {log.targetLabel ?? log.targetId}
                    </a>
                  ) : (
                    <span>{log.targetLabel ?? log.targetId ?? "-"}</span>
                  )}
                  {log.action === "role_change" && log.metadata && (
                    <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
                      ({String(log.metadata.from)} → {String(log.metadata.to)})
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{log.actor.username}</td>
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(log.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

type AdminPanelProps = {
  posts: AdminPostListItem[];
  comments: AdminCommentListItem[];
  users: AdminUserListItem[];
  auditLogs: AdminAuditLogListItem[];
  reports: AdminReportListItem[];
  currentUserId: string;
};

export function AdminPanel({ posts, comments, users, auditLogs, reports, currentUserId }: AdminPanelProps) {
  const pendingReportCount = reports.filter((report) => report.status === "pending").length;
  const [activeTab, setActiveTab] = useState<AdminTab>("posts");

  return (
    <div>
      <div
        role="tablist"
        aria-label="관리자 메뉴"
        className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-700"
      >
        <DashboardLink />
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${isActive
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
            >
              {tab.label}
              {tab.id === "reports" && pendingReportCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {pendingReportCount}
                </span>
              )}
              {isActive && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-900 dark:bg-zinc-100" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4" role="tabpanel">
        {activeTab === "posts" && <PostsTable posts={posts} />}
        {activeTab === "comments" && <CommentsTable comments={comments} />}
        {activeTab === "users" && <UsersTable users={users} currentUserId={currentUserId} />}
        {activeTab === "reports" && <ReportsTable reports={reports} />}
        {activeTab === "audit-log" && <AuditLogTable logs={auditLogs} />}
      </div>
    </div>
  );
}
