import { getUnreadNotificationCount } from "@/features/notifications/queries";
import { getCurrentUser } from "@/server/auth/current-user";
import { isAdmin } from "@/server/auth/permissions";
import { resolveStoragePublicUrl } from "@/lib/storage-url";
import { Header } from "./header";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unreadNotificationCount = user ? await getUnreadNotificationCount(user.id) : 0;

  return (
    <Header
      user={
        user
          ? {
              id: user.id,
              username: user.username,
              displayName: user.displayName ?? user.username,
              displayNameInput: user.displayName ?? "",
              bio: user.bio ?? "",
              avatarUrl: resolveStoragePublicUrl(user.avatarUrl),
              isAdmin: isAdmin(user),
            }
          : null
      }
      unreadNotificationCount={unreadNotificationCount}
    />
  );
}
