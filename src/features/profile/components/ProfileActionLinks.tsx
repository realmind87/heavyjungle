import Link from "next/link";
import { outlineChipClass } from "@/lib/ui-classes";

type ProfileActionLinksProps = {
  username: string;
  hasPassword: boolean;
};

/** 공개 프로필 — 본인일 때 수정/설정 링크 (소프트 내비 시 @modal 인터셉트) */
export function ProfileActionLinks({ username, hasPassword }: ProfileActionLinksProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/u/${username}/edit`} className={outlineChipClass}>
        프로필 수정
      </Link>
      {hasPassword && (
        <>
          <Link href={`/u/${username}/settings/password`} className={outlineChipClass}>
            비밀번호 변경
          </Link>
          <Link href={`/u/${username}/settings/email`} className={outlineChipClass}>
            이메일 변경
          </Link>
        </>
      )}
    </div>
  );
}
