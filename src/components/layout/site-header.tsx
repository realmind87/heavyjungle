import { getCurrentUser } from "@/server/auth/current-user";
import { isAdmin } from "@/server/auth/permissions";
import { resolveAvatarPublicUrl } from "@/lib/public-object-url";
import { Header } from "./header";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <Header
      user={
        user
          ? {
              username: user.username,
              displayName: user.displayName ?? user.username,
              avatarUrl: resolveAvatarPublicUrl(user.avatarUrl),
              isAdmin: isAdmin(user),
            }
          : null
      }
    />
  );
}
