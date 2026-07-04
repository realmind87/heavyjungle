"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { toast } from "@/components/ui/toast";
import { reportComment, reportPost, type ReportActionState } from "@/features/reports/actions";
import { REPORT_REASON_LABEL, type ReportReason } from "@/features/reports/types";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  errorTextClass,
  labelClass,
  textareaClass,
} from "@/lib/ui-classes";

const REASON_OPTIONS: ReportReason[] = ["spam", "abuse", "illegal", "other"];

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      />
    </svg>
  );
}

type ReportModalProps = {
  targetType: "post" | "comment";
  targetId: string;
  onClose: () => void;
};

function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const titleId = useId();
  const action = targetType === "post" ? reportPost : reportComment;
  const [state, formAction, pending] = useActionState(action, {} as ReportActionState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "신고가 접수되었습니다.");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onClose 재실행 방지
  }, [state.success]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" aria-label="닫기" className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-[420px] max-w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <h2 id={titleId} className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {targetType === "post" ? "글 신고" : "댓글 신고"}
        </h2>

        <form action={formAction} className="mt-4">
          <input type="hidden" name={targetType === "post" ? "postId" : "commentId"} value={targetId} />

          <fieldset className="space-y-2">
            <legend className={labelClass}>신고 사유</legend>
            {REASON_OPTIONS.map((reason) => (
              <label key={reason} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input type="radio" name="reason" value={reason} defaultChecked={reason === "spam"} required />
                {REPORT_REASON_LABEL[reason]}
              </label>
            ))}
          </fieldset>

          <label className="mt-4 block">
            <span className={labelClass}>상세 내용 (선택)</span>
            <textarea name="detail" rows={3} maxLength={500} className={textareaClass} placeholder="신고 사유를 자세히 적어주세요." />
          </label>

          {state.error && <p className={`mt-3 ${errorTextClass}`}>{state.error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className={buttonSecondaryClass}>
              취소
            </button>
            <button type="submit" disabled={pending} className={buttonPrimaryClass}>
              {pending ? "신고 중..." : "신고하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ReportButtonProps = {
  targetType: "post" | "comment";
  targetId: string;
  className?: string;
};

export function ReportButton({ targetType, targetId, className }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="신고"
        className={
          className ??
          "inline-flex shrink-0 items-center justify-center p-1 text-zinc-500 transition hover:text-red-600 dark:hover:text-red-400"
        }
      >
        <ReportIcon />
      </button>

      {isOpen && <ReportModal targetType={targetType} targetId={targetId} onClose={() => setIsOpen(false)} />}
    </>
  );
}
