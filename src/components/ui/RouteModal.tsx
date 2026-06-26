"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

type RouteModalProps = {
  title: string;
  children: ReactNode;
};

export function RouteModal({ title, children }: RouteModalProps) {
  const router = useRouter();

  return (
    <Modal open onClose={() => router.back()} title={title}>
      {children}
    </Modal>
  );
}
