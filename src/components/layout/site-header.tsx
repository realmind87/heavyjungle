import { getCurrentUser } from "@/server/auth/current-user";
import { Header } from "./header";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <Header
      user={
        user
          ? {
              username: user.username,
            }
          : null
      }
    />
  );
}
