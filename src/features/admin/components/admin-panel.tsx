"use client";

import { useActionState, useState } from "react";
import {
  adminDeleteComment,
  adminDeletePost,
  setUserRole,
  type AdminActionState,
} from "@/features/admin/actions";
import type {
  AdminCommentListItem,
  AdminPostListItem,
  AdminUserListItem,
} from "@/features/admin/queries";
import { buttonDangerClass, buttonSecondaryClass, errorTextClass } from "@/lib/ui-classes";

type AdminTab = "posts" | "comments" | "users";

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: "posts", label: "최신 글" },
  { id: "comments", label: "최신 댓글" },
  { id: "users", label: "사용자" },
];

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

type AdminPanelProps = {
  posts: AdminPostListItem[];
  comments: AdminCommentListItem[];
  users: AdminUserListItem[];
  currentUserId: string;
};

export function AdminPanel({ posts, comments, users, currentUserId }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("posts");

  return (
    <div>
      <div
        role="tablist"
        aria-label="관리자 메뉴"
        className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition ${isActive
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
            >
              {tab.label}
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
      </div>
    </div>
  );
}
