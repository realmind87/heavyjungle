"use client";

import { useActionState, useEffect, useState } from "react";
import { AvatarUploader } from "@/features/profile/components/AvatarUploader";
import { updateProfile, type ProfileActionState } from "@/features/profile/actions";
import {
  buttonPrimaryFullClass,
  buttonSecondaryClass,
  errorTextClass,
  inputClass,
  labelMediumClass,
  mutedTextClass,
  textareaClass,
} from "@/lib/ui-classes";

type ProfileSetupFormProps = {
  username: string;
  initial: {
    displayName: string;
    bio: string;
    avatarPublicUrl: string | null;
  };
  onComplete: () => void;
  onSkip: () => void;
};

/** 회원가입 직후 프로필 설정 — 모두 선택, 건너뛰기 가능 */
export function ProfileSetupForm({ username, initial, onComplete, onSkip }: ProfileSetupFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, {} as ProfileActionState);
  const [displayNameValue, setDisplayNameValue] = useState(initial.displayName);
  const previewName = displayNameValue.trim() || username;

  useEffect(() => {
    if (!state.success) return;
    onComplete();
  }, [state.success, onComplete]);

  return (
    <div className="space-y-6">
      <p className={`text-sm ${mutedTextClass}`}>
        프로필 사진과 소개를 등록할 수 있어요. 지금 건너뛰어도 기본 아이디로 이용할 수 있습니다.
      </p>

      <AvatarUploader displayName={previewName} initialPublicUrl={initial.avatarPublicUrl} />

      <form action={formAction} className="space-y-4">
        <label className="block">
          <span className={labelMediumClass}>표시 이름 (선택)</span>
          <input
            name="displayName"
            value={displayNameValue}
            onChange={(event) => setDisplayNameValue(event.target.value)}
            maxLength={30}
            placeholder="비워두면 아이디가 표시됩니다"
            className={`mt-1 ${inputClass}`}
          />
        </label>

        <label className="block">
          <span className={labelMediumClass}>소개 (선택)</span>
          <textarea
            name="bio"
            defaultValue={initial.bio}
            maxLength={300}
            rows={4}
            placeholder="자기소개를 입력하세요"
            className={`mt-1 ${textareaClass}`}
          />
        </label>

        {state.error && <p className={errorTextClass}>{state.error}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onSkip} className={buttonSecondaryClass}>
            나중에 하기
          </button>
          <button type="submit" disabled={pending} className={buttonPrimaryFullClass}>
            {pending ? "저장 중..." : "저장하고 시작하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
