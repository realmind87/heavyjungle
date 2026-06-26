"use client";

/**
 * 아바타 파일 업로더 — presigned PUT → confirm → 미리보기 갱신.
 * 1) createAvatarUploadUrl  2) fetch PUT  3) confirmAvatarUpload
 */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileAvatar } from "@/features/profile/components/ProfileAvatar";
import { AVATAR_ALLOWED_CONTENT_TYPES, AVATAR_MAX_BYTES } from "@/features/uploads/constants";
import { confirmAvatarUpload, createAvatarUploadUrl } from "@/features/uploads/actions";
import { buttonSecondaryClass, errorTextClass, mutedTextClass } from "@/lib/ui-classes";

type AvatarUploaderProps = {
  displayName: string;
  initialPublicUrl: string | null;
};

type UploadStatus = "idle" | "uploading" | "confirming";

export function AvatarUploader({ displayName, initialPublicUrl }: AvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPublicUrl);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);

    if (!(AVATAR_ALLOWED_CONTENT_TYPES as readonly string[]).includes(file.type)) {
      setError("JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setStatus("uploading");

    const intent = await createAvatarUploadUrl({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    });

    if ("error" in intent) {
      setError(intent.error);
      setStatus("idle");
      return;
    }

    const putResponse = await fetch(intent.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!putResponse.ok) {
      setError("파일 업로드에 실패했습니다.");
      setStatus("idle");
      return;
    }

    setStatus("confirming");

    const confirmed = await confirmAvatarUpload(intent.key);
    if ("error" in confirmed) {
      setError(confirmed.error);
      setStatus("idle");
      return;
    }

    setPreviewUrl(confirmed.publicUrl);
    setStatus("idle");
    router.refresh();
  }

  const busy = status !== "idle";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <ProfileAvatar name={displayName} avatarUrl={previewUrl} size="lg" />
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={buttonSecondaryClass}
          >
            {busy ? (status === "uploading" ? "업로드 중..." : "확인 중...") : "이미지 선택"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={AVATAR_ALLOWED_CONTENT_TYPES.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
          <p className={`mt-1 text-xs ${mutedTextClass}`}>JPEG, PNG, WebP · 최대 5MB</p>
        </div>
      </div>
      {error && <p className={errorTextClass}>{error}</p>}
    </div>
  );
}
