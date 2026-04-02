import { useCallback, useEffect } from "react";

/**
 * Dark mode disabled — Techniq theme is light-only.
 * Hook kept for backward compatibility.
 */
export function useDarkMode() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try { localStorage.removeItem("storefront-dark-mode"); } catch {}
  }, []);

  const toggle = useCallback(() => {}, []);
  return { isDark: false, toggle };
}
