import type { ReactNode } from "react";

type ProfileLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
};

/** 공개 프로필 레이아웃 — children(프로필) + @modal 슬롯 병렬 렌더 */
export default function ProfileLayout({ children, modal }: ProfileLayoutProps) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
