import { redirect } from "next/navigation";
import { RouteModal } from "@/components/ui/RouteModal";
import { ChangeEmailForm } from "@/features/profile/components/ChangeEmailForm";
import { requireProfileOwner } from "@/features/profile/require-profile-owner";

type PageProps = {
  params: Promise<{ username: string }>;
};

/** 이메일 변경 — 소프트 내비 인터셉트 모달 */
export default async function ChangeEmailInterceptPage({ params }: PageProps) {
  const { username } = await params;
  const user = await requireProfileOwner(username, `/u/${username}/settings/email`);

  if (!user.passwordHash) {
    redirect(`/u/${username}`);
  }

  return (
    <RouteModal title="이메일 변경">
      <ChangeEmailForm username={username} variant="modal" currentEmail={user.email} />
    </RouteModal>
  );
}
