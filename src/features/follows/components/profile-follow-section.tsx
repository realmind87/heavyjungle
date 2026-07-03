"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toast } from "@/components/ui/toast";
import { toggleFollow, type ToggleFollowResult } from "@/features/follows/actions";
import { buttonPrimaryClass, buttonSecondaryClass, mutedTextClass } from "@/lib/ui-classes";

type FollowState = {
  following: boolean;
  followerCount: number;
};

type ProfileFollowSectionProps = {
  username: string;
  targetUserId: string;
  postCount: number;
  initialFollowing: boolean;
  initialFollowerCount: number;
  followingCount: number;
  isOwner: boolean;
  isLoggedIn: boolean;
  /** 양방향 차단 시 팔로우 버튼 숨김 */
  isBlockedRelation?: boolean;
};

/** 프로필 글·팔로워·팔로잉 수 + 팔로우 버튼 */
export function ProfileFollowSection({
  username,
  targetUserId,
  postCount,
  initialFollowing,
  initialFollowerCount,
  followingCount,
  isOwner,
  isLoggedIn,
  isBlockedRelation = false,
}: ProfileFollowSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [followState, setFollowState] = useState<FollowState>({
    following: initialFollowing,
    followerCount: initialFollowerCount,
  });
  const [optimistic, setOptimistic] = useOptimistic(
    followState,
    (state: FollowState, nextFollowing: boolean): FollowState => ({
      following: nextFollowing,
      followerCount: Math.max(0, state.followerCount + (nextFollowing ? 1 : -1)),
    }),
  );

  useEffect(() => {
    setFollowState({
      following: initialFollowing,
      followerCount: initialFollowerCount,
    });
  }, [targetUserId, initialFollowing, initialFollowerCount]);

  function handleToggle() {
    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const nextFollowing = !optimistic.following;

    startTransition(async () => {
      setOptimistic(nextFollowing);
      const result: ToggleFollowResult = await toggleFollow(targetUserId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.following !== undefined && result.followerCount !== undefined) {
        setFollowState({
          following: result.following,
          followerCount: result.followerCount,
        });
      }
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <div className={`flex flex-wrap gap-4 ${mutedTextClass}`}>
        <span>
          글 <span className="font-medium text-zinc-900 dark:text-zinc-50">{postCount}</span>
        </span>
        <Link
          href={`/u/${username}/followers`}
          className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          팔로워{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{optimistic.followerCount}</span>
        </Link>
        <Link
          href={`/u/${username}/following`}
          className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          팔로잉{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{followingCount}</span>
        </Link>
      </div>

      {!isOwner && !isBlockedRelation && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggle}
          className={optimistic.following ? buttonSecondaryClass : buttonPrimaryClass}
        >
          {isPending ? "처리 중..." : optimistic.following ? "팔로잉" : "팔로우"}
        </button>
      )}
    </div>
  );
}
