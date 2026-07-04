import type { Metadata } from "next";
import { SiteBottomNav } from "@/components/layout/site-bottom-nav";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { buildPageMetadata } from "@/lib/metadata";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Heavy Jungle",
    description: "Heavy Jungle — 개발자 커뮤니티",
    path: "/",
  }),
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className="antialiased bg-white pb-16 text-zinc-900 md:pb-0 dark:bg-zinc-950 dark:text-zinc-50"
        cz-shortcut-listen="true"
      >
        <ThemeProvider>
          <QueryProvider>
            <ToastProvider>{children}</ToastProvider>
            <SiteBottomNav />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
