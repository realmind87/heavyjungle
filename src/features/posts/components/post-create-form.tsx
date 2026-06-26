"use client";

import { useActionState } from "react";
import { createPost, type PostActionState } from "@/features/posts/actions";

/** 글 작성 폼 — Server Action + useActionState */
export function PostCreateForm() {
  const [state, formAction, pending] = useActionState(createPost, {} as PostActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          제목
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="제목을 입력하세요"
          className="mt-1 w-full border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium">
          내용
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={12}
          placeholder="내용을 입력하세요"
          className="mt-1 w-full border px-3 py-2 text-sm"
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="border bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "등록 중..." : "글 등록"}
      </button>
    </form>
  );
}
