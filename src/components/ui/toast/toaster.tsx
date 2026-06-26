"use client";

import { useEffect, useState } from "react";
import { subscribe } from "@/components/ui/toast/store";
import { ToastItem } from "@/components/ui/toast/toast-item";
import type { Toast } from "@/components/ui/toast/types";

/** 전역 토스트 렌더러 — RootLayout에 한 번만 마운트 */
export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribe(setToasts), []);

  return (
    <div
      aria-label="알림"
      className="pointer-events-none fixed bottom-4 right-4 z-[110] flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} />
      ))}
    </div>
  );
}
