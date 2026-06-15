/**
 * useTheme — tiny client hook that reads / writes the user's
 * light-vs-dark preference.
 *
 * State is mirrored both to `localStorage["wl-srv-theme"]` and to
 * `<html data-theme="...">`, which is the selector our CSS variables
 * cascade against. Default = "dark".
 *
 * Shared by the producer TopBar and the artist /listen Topbar so a
 * user toggling on one side carries it to the other.
 */

"use client";

import * as React from "react";

const THEME_KEY = "wl-srv-theme";
export type ThemeMode = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = React.useState<ThemeMode>("dark");

  React.useEffect(() => {
    const stored =
      (localStorage.getItem(THEME_KEY) as ThemeMode | null) ?? "dark";
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((t) => {
      const next: ThemeMode = t === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      document.documentElement.setAttribute("data-theme", next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
