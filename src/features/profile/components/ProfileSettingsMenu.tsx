"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/components/ui/toast";
import { signOut } from "@/features/auth/actions";
import { blockUser, unblockUser } from "@/features/blocks/actions";
import type { FollowUserSummary } from "@/features/follows/types";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { mutedTextClass } from "@/lib/ui-classes";

type ProfileSettingsMenuProps = {
  username: string;
  targetUserId: string;
  isOwner: boolean;
  hasPassword: boolean;
  isLoggedIn: boolean;
  isBlocking: boolean;
  likesReceived: number;
  createdAt: string;
  /** 본인 프로필이고 관리자일 때 — 관리자 링크 노출 */
  isAdmin?: boolean;
  /** 본인 프로필일 때만 — 차단한 사용자 목록 */
  blockedUsers?: FollowUserSummary[];
};

type MenuView = "menu" | "info" | "blocked";

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

const menuItemClass =
  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800";

const blockButtonClass =
  "flex w-full items-center rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40";

function modalTitle(view: MenuView) {
  if (view === "info") return "정보";
  if (view === "blocked") return "차단한 사용자";
  return "설정";
}

/** 프로필 설정 아이콘 + 메뉴 모달 */
export function ProfileSettingsMenu({
  username,
  targetUserId,
  isOwner,
  hasPassword,
  isLoggedIn,
  isBlocking,
  likesReceived,
  createdAt,
  isAdmin = false,
  blockedUsers = [],
}: ProfileSettingsMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>("menu");
  const [isPending, startTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [blockedList, setBlockedList] = useState(blockedUsers);

  useEffect(() => {
    setBlockedList(blockedUsers);
  }, [blockedUsers]);

  function openMenu() {
    setView("menu");
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    setView("menu");
    setPendingUserId(null);
  }

  function handleBlockToggle() {
    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    if (!isBlocking && !confirm(`${username} 님을 차단할까요?\n팔로우 관계가 해제되고 서로의 글이 보이지 않습니다.`)) {
      return;
    }

    startTransition(async () => {
      setPendingUserId(targetUserId);
      const result = isBlocking
        ? await unblockUser(targetUserId)
        : await blockUser(targetUserId);

      setPendingUserId(null);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(isBlocking ? "차단을 해제했습니다." : "사용자를 차단했습니다.");
      closeMenu();
      router.refresh();
    });
  }

  function handleUnblockFromList(user: FollowUserSummary) {
    if (!confirm(`${user.displayName ?? user.username} 님의 차단을 해제할까요?`)) {
      return;
    }

    startTransition(async () => {
      setPendingUserId(user.id);
      const result = await unblockUser(user.id);
      setPendingUserId(null);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setBlockedList((prev) => prev.filter((item) => item.id !== user.id));
      toast.success("차단을 해제했습니다.");
      router.refresh();
    });
  }

  const joinDate = new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <button
        type="button"
        aria-label="프로필 설정"
        onClick={openMenu}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <SettingsIcon />
      </button>

      <Modal open={open} onClose={closeMenu} title={modalTitle(view)}>
        {view === "info" ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setView("menu")}
              className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← 설정으로
            </button>
            <dl className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-lg bg-zinc-50 px-3 py-3 dark:bg-zinc-800/60">
                <dt className={mutedTextClass}>받은 좋아요</dt>
                <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{likesReceived}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-zinc-50 px-3 py-3 dark:bg-zinc-800/60">
                <dt className={mutedTextClass}>가입일</dt>
                <dd className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{joinDate}</dd>
              </div>
            </dl>
          </div>
        ) : view === "blocked" ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setView("menu")}
              className="text-sm text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ← 설정으로
            </button>

            {blockedList.length === 0 ? (
              <p className={`py-8 text-center ${mutedTextClass}`}>차단한 사용자가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {blockedList.map((user) => {
                  const displayName = user.displayName ?? user.username;
                  const unblocking = isPending && pendingUserId === user.id;

                  return (
                    <li key={user.id} className="flex items-center gap-3 py-3">
                      <Link
                        href={`/u/${user.username}`}
                        onClick={closeMenu}
                        className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-80"
                      >
                        <ProfileAvatar name={displayName} avatarUrl={user.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {displayName}
                          </p>
                          <p className={`truncate ${mutedTextClass}`}>@{user.username}</p>
                        </div>
                      </Link>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUnblockFromList(user)}
                        className="shrink-0 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        {unblocking ? "처리 중..." : "차단 해제"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <ul className="space-y-1">
            <li>
              <button type="button" onClick={() => setView("info")} className={menuItemClass}>
                <span>정보</span>
                <ChevronIcon />
              </button>
            </li>

            {isOwner && (
              <>
                <li>
                  <Link href={`/u/${username}/edit`} onClick={closeMenu} className={menuItemClass}>
                    <span>프로필 수정</span>
                    <ChevronIcon />
                  </Link>
                </li>
                {hasPassword && (
                  <>
                    <li>
                      <Link
                        href={`/u/${username}/settings/password`}
                        onClick={closeMenu}
                        className={menuItemClass}
                      >
                        <span>비밀번호 변경</span>
                        <ChevronIcon />
                      </Link>
                    </li>
                    <li>
                      <Link
                        href={`/u/${username}/settings/email`}
                        onClick={closeMenu}
                        className={menuItemClass}
                      >
                        <span>이메일 변경</span>
                        <ChevronIcon />
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <button type="button" onClick={() => setView("blocked")} className={menuItemClass}>
                    <span>차단한 사용자</span>
                    <span className="flex items-center gap-2">
                      {blockedList.length > 0 && (
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                          {blockedList.length}
                        </span>
                      )}
                      <ChevronIcon />
                    </span>
                  </button>
                </li>

                {isAdmin && (
                  <li>
                    <Link href="/admin" onClick={closeMenu} className={menuItemClass}>
                      <span>관리자</span>
                      <ChevronIcon />
                    </Link>
                  </li>
                )}

                <li className="mt-1 border-t border-zinc-200 pt-1 dark:border-zinc-800">
                  <form action={signOut}>
                    <button type="submit" className={`${menuItemClass} text-red-600 dark:text-red-400`}>
                      <span>로그아웃</span>
                    </button>
                  </form>
                </li>
              </>
            )}

            {!isOwner && (
              <li>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleBlockToggle}
                  className={blockButtonClass}
                >
                  {isPending && pendingUserId === targetUserId
                    ? "처리 중..."
                    : isBlocking
                      ? "차단 해제"
                      : "차단"}
                </button>
              </li>
            )}
          </ul>
        )}
      </Modal>
    </>
  );
}
