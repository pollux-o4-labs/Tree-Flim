import { useEffect, useState } from "react";

export type TotalTheme = "light" | "dark";

export function useTotalTheme() {
  const [systemTheme, setSystemTheme] = useState<TotalTheme>(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  const [theme, setTheme] = useState<TotalTheme>(systemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setTheme(systemTheme);
  }, [systemTheme]);

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme: () =>
      setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
