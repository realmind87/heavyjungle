"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { getStoredTheme, persistTheme } from "@/lib/theme";

export function ThemeBootstrap() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const stored = getStoredTheme();
    persistTheme(stored);
    setTheme(stored);
  }, [setTheme]);

  return null;
}
