export type ThemeId = "dark" | "light";

const THEME_ATTR = "data-theme";

/** Apply Workspace theme to the document (all webviews). */
export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute(THEME_ATTR, theme);
}

export function readTheme(): ThemeId {
  const value = document.documentElement.getAttribute(THEME_ATTR);
  return value === "light" ? "light" : "dark";
}
