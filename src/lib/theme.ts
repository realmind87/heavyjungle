export type ThemeMode = "light" | "dark";

export const themeStorageKey = "heavyjungle-theme";
export const defaultTheme: ThemeMode = "light";

export function resolveTheme(stored: string | null): ThemeMode {
  return stored === "dark" ? "dark" : "light";
}

export function applyThemeToDocument(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

export function persistTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(themeStorageKey, mode);
  } catch {
    // ignore (private browsing, etc.)
  }
  applyThemeToDocument(mode);
}

export function getStoredTheme(): ThemeMode {
  try {
    return resolveTheme(localStorage.getItem(themeStorageKey));
  } catch {
    return defaultTheme;
  }
}

export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("${themeStorageKey}");
    var mode = stored === "dark" ? "dark" : "light";
    var root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
  } catch (e) {}
})();
`;
