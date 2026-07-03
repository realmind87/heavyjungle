import Link from "next/link";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";

type ProfileAuthorLinkProps = {
  username: string;
  displayName?: string | null;
  /** 공개 URL (서버에서 resolveAvatarPublicUrl 적용 후 전달) */
  avatarUrl?: string | null;
  size?: "xs" | "sm";
  className?: string;
};

/** 작성자 아바타·표시 이름 — 프로필 페이지로 이동 */
export function ProfileAuthorLink({
  username,
  displayName,
  avatarUrl,
  size = "xs",
  className = "",
}: ProfileAuthorLinkProps) {
  const name = displayName ?? username;

  return (
    <Link
      href={`/u/${username}`}
      className={`inline-flex min-w-0 items-center gap-1.5 transition hover:opacity-80 ${className}`}
    >
      <ProfileAvatar name={name} avatarUrl={avatarUrl} size={size} />
      <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">{name}</span>
    </Link>
  );
}
