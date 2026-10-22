import { useState, useEffect } from "react";

/** Returns true when the CSS media query matches. SSR-safe. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/** Returns true on mobile-width screens (<=768px) */
export const useIsMobile = () => useMediaQuery("(max-width: 768px)");

