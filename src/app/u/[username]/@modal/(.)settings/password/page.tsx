import { redirect } from "next/navigation";
import { RouteModal } from "@/components/ui/RouteModal";
import { ChangePasswordForm } from "@/features/profile/components/ChangePasswordForm";
import { requireProfileOwner } from "@/features/profile/require-profile-owner";

type PageProps = {
  params: Promise<{ username: string }>;
};

/** 비밀번호 변경 — 소프트 내비 인터셉트 모달 */
export default async function ChangePasswordInterceptPage({ params }: PageProps) {
  const { username } = await params;
  const user = await requireProfileOwner(username, `/u/${username}/settings/password`);

  if (!user.passwordHash) {
    redirect(`/u/${username}`);
  }

  return (
    <RouteModal title="비밀번호 변경">
      <ChangePasswordForm username={username} variant="modal" />
    </RouteModal>
  );
}
