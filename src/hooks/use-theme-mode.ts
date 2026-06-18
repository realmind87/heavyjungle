"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { getStoredTheme, persistTheme, type ThemeMode } from "@/lib/theme";

export function useThemeMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      persistTheme(mode);
      setTheme(mode);
    },
    [setTheme],
  );

  return {
    mounted,
    theme: mounted ? ((resolvedTheme as ThemeMode | undefined) ?? getStoredTheme()) : ("light" as ThemeMode),
    isDark: mounted ? resolvedTheme === "dark" : false,
    setThemeMode,
  };
}
