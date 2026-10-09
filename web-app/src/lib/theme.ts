export type ThemeId = "classic" | "aurora" | "harbor";

/** `font` is the Google Fonts stylesheet for a theme's display type; Classic uses system fonts and needs none. */
export const THEMES: { id: ThemeId; label: string; font?: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "aurora", label: "Aurora", font: "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" },
  { id: "harbor", label: "Harbor", font: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" },
];

const STORAGE_KEY = "addimpact.theme";
const FONT_LINK_ID = "theme-display-font";

function isTheme(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function getTheme(): ThemeId {
  const current = document.documentElement.dataset.theme ?? null;
  return isTheme(current) ? current : "classic";
}

/** A theme's display font is fetched only while it is active, so Classic makes no extra request. */
function syncFont(theme: ThemeId) {
  const existing = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  const href = THEMES.find((t) => t.id === theme)?.font;
  if (!href) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.href = href;
    return;
  }
  const link = document.createElement("link");
  link.id = FONT_LINK_ID;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

export function setTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  syncFont(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the theme still applies for this page view.
  }
}

/** Runs before first render. `?theme=aurora` in the URL wins (handy for sharing a preview link), then the saved choice. */
export function initTheme() {
  let chosen: string | null = new URLSearchParams(window.location.search).get("theme");
  if (!isTheme(chosen)) {
    try {
      chosen = localStorage.getItem(STORAGE_KEY);
    } catch {
      chosen = null;
    }
  }
  setTheme(isTheme(chosen) ? chosen : "classic");
}
