import { useState, useCallback } from "react";

/**
 * Copy text to clipboard with temporary "copied" feedback state.
 * Falls back to execCommand for older browsers / WebViews.
 */
export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity  = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    } catch {
      /* ignore */
    }
  }, [resetMs]);

  return { copy, copied };
}

