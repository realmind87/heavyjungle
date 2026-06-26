/** 프로필 아바타 — S3 공개 URL 또는 이니셜 */
type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-24 w-24 text-3xl",
};

export function ProfileAvatar({ name, avatarUrl, size = "md" }: ProfileAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const className = `inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 font-semibold text-white ring-2 ring-zinc-200 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-700 ${sizeClasses[size]}`;

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- S3 공개 URL (resolveAvatarPublicUrl로 조합됨)
      <img
        src={avatarUrl}
        alt={`${name} 아바타`}
        className={`${sizeClasses[size]} shrink-0 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700`}
      />
    );
  }

  return <span className={className}>{initial}</span>;
}
