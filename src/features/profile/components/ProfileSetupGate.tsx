"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ProfileSetupForm } from "@/features/profile/components/ProfileSetupForm";
import {
  dismissProfileSetup,
  isProfileSetupDismissed,
  PROFILE_SETUP_QUERY,
} from "@/lib/profile-setup";

type ProfileSetupGateProps = {
  userId: string;
  username: string;
  initial: {
    displayName: string;
    bio: string;
    avatarPublicUrl: string | null;
  };
};

export function ProfileSetupGate({ userId, username, initial }: ProfileSetupGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const clearSetupQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has(PROFILE_SETUP_QUERY)) return;
    params.delete(PROFILE_SETUP_QUERY);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, router, searchParams]);

  const closeSetup = useCallback(() => {
    dismissProfileSetup(userId);
    setOpen(false);
    clearSetupQuery();
    router.refresh();
  }, [clearSetupQuery, router, userId]);

  useEffect(() => {
    const shouldPrompt = searchParams.get(PROFILE_SETUP_QUERY) === "1";
    if (!shouldPrompt || isProfileSetupDismissed(userId)) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [searchParams, userId]);

  return (
    <Modal open={open} onClose={closeSetup} title="프로필 설정">
      <ProfileSetupForm
        username={username}
        initial={initial}
        onComplete={closeSetup}
        onSkip={closeSetup}
      />
    </Modal>
  );
}
