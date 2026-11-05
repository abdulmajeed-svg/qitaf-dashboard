"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";

export const THEME_KEY = "qitaf-theme";

export function ThemeToggle() {
  const { t } = useLang();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage can be blocked; the theme still applies for this visit */
    }
  }

  return (
    <button type="button" className="btn-ghost" onClick={toggle} aria-label={theme === "dark" ? t.theme.switchToLight : t.theme.switchToDark}>
      {theme === "dark" ? t.theme.light : t.theme.dark}
    </button>
  );
}
