"use client";

import { toast } from "@/components/ui/toast/store";

/** 컴포넌트 안에서 토스트 API를 쓰기 위한 훅 */
export function useToast() {
  return { toast };
}
