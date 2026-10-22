import { useEffect, useRef } from "react";

/**
 * Safe setInterval hook that survives React re-renders without
 * accumulating duplicate intervals. Pass null delay to pause.
 */
export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCb = useRef(callback);

  useEffect(() => { savedCb.current = callback; }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => savedCb.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}

