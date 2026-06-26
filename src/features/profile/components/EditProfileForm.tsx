"use client";

/**
 * 프로필 수정 폼 — 인터셉트 모달·풀페이지 공용.
 * 아바타는 AvatarUploader(presigned URL)로 별도 업로드.
 */
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AvatarUploader } from "@/features/profile/components/AvatarUploader";
import { updateProfile, type ProfileActionState } from "@/features/profile/actions";

type EditProfileFormProps = {
  username: string;
  variant: "modal" | "page";
  displayName: string;
  initial: {
    displayName: string;
    bio: string;
    avatarPublicUrl: string | null;
  };
};

export function EditProfileForm({ username, variant, displayName, initial }: EditProfileFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfile, {} as ProfileActionState);

  useEffect(() => {
    if (!state.success) return;

    if (variant === "modal") {
      router.back();
    } else {
      router.replace(`/u/${username}`);
    }
    router.refresh();
  }, [state.success, variant, username, router]);

  return (
    <div className="space-y-6">
      <AvatarUploader displayName={displayName} initialPublicUrl={initial.avatarPublicUrl} />

      <form action={formAction} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">표시 이름</span>
          <input
            name="displayName"
            defaultValue={initial.displayName}
            maxLength={30}
            placeholder="비워두면 아이디가 표시됩니다"
            className="mt-1 w-full border px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">소개</span>
          <textarea
            name="bio"
            defaultValue={initial.bio}
            maxLength={300}
            rows={4}
            placeholder="자기소개를 입력하세요"
            className="mt-1 w-full border px-3 py-2 text-sm"
          />
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && !state.error && <p className="text-sm text-green-600">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full border bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </form>
    </div>
  );
}
