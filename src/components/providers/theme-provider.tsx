"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeBootstrap } from "@/components/providers/theme-bootstrap";
import { defaultTheme, themeStorageKey } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
      storageKey={themeStorageKey}
      disableTransitionOnChange
    >
      <ThemeBootstrap />
      {children}
    </NextThemesProvider>
  );
}
