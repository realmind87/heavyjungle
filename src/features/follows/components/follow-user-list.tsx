"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FollowUserSummary } from "@/features/follows/types";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { inputClass, mutedTextClass } from "@/lib/ui-classes";

type FollowUserListProps = {
  users: FollowUserSummary[];
  emptyMessage: string;
  searchPlaceholder?: string;
};

function matchesQuery(user: FollowUserSummary, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const username = user.username.toLowerCase();
  const displayName = (user.displayName ?? "").toLowerCase();
  const bareQuery = q.startsWith("@") ? q.slice(1) : q;

  return username.includes(bareQuery) || displayName.includes(q);
}

/** 팔로워/팔로잉 사용자 목록 — 아이디·표시 이름 검색 */
export function FollowUserList({
  users,
  emptyMessage,
  searchPlaceholder = "아이디 또는 이름으로 검색",
}: FollowUserListProps) {
  const [query, setQuery] = useState("");

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesQuery(user, query)),
    [users, query],
  );

  const hasQuery = query.trim().length > 0;

  return (
    <div>
      <div className="relative mb-3">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3-3" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className={`${inputClass} pl-9`}
        />
      </div>

      {users.length === 0 ? (
        <p className={`py-8 text-center ${mutedTextClass}`}>{emptyMessage}</p>
      ) : filteredUsers.length === 0 ? (
        <p className={`py-8 text-center ${mutedTextClass}`}>검색 결과가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filteredUsers.map((user) => {
            const displayName = user.displayName ?? user.username;
            return (
              <li key={user.id}>
                <Link
                  href={`/u/${user.username}`}
                  className="flex items-center gap-3 px-1 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                >
                  <ProfileAvatar name={displayName} avatarUrl={user.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {displayName}
                    </p>
                    <p className={`truncate ${mutedTextClass}`}>@{user.username}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {hasQuery && filteredUsers.length > 0 && (
        <p className={`mt-3 text-center text-xs ${mutedTextClass}`}>
          {filteredUsers.length}명
        </p>
      )}
    </div>
  );
}
