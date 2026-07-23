import type { ThemeId } from "./types";

export type ResolvedTheme = "dark" | "light";

const THEME_ATTR = "data-theme";

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(theme: ThemeId): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

/** Apply resolved theme to document (CSS tokens). */
export function applyTheme(theme: ThemeId): ResolvedTheme {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute(THEME_ATTR, resolved);
  return resolved;
}

/** Listen for OS dark/light changes. */
export function watchSystemTheme(onChange: () => void): () => void {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => onChange();
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
