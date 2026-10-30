/** Utility to merge class names (simple version, no clsx dependency needed) */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Shorten a wallet address for display */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/** Format relative time (e.g., "2h ago", "yesterday") */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  // Use Date.now() inside the function body (not at module level) to avoid blocking prerender
  const nowMs = typeof window !== "undefined" ? Date.now() : date.getTime();
  const now = new Date(nowMs);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/** Format a chat timestamp for message bubbles */
export function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/** Generate a deterministic HSL color from a string (for avatars) */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

/** Get initials from a display name (emoji-safe, uses Unicode code points) */
export function getInitials(name: string): string {
  // Strip leading emojis/symbols before splitting
  const cleaned = name.replace(/^[^\p{L}\p{N}]+/gu, "").trim();
  const words = cleaned.split(/\s+/);
  if (words.length === 0 || !words[0]) return "?";
  // Use Array.from to correctly iterate Unicode code points (emoji-safe)
  const first = Array.from(words[0])[0] ?? "";
  const second = words[1] ? Array.from(words[1])[0] ?? "" : "";
  return (first + second).toUpperCase();
}

/** Format AVAX / fiat amounts with locale-aware separators */
export function formatCurrency(value: number, symbol = "AVAX", decimals = 4): string {
  return `${value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${symbol}`;
}

/** Clamp a number between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
