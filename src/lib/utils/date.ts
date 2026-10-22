export function formatTimestamp(unixSeconds: number | bigint): string {
  const ts = typeof unixSeconds === "bigint" ? Number(unixSeconds) : unixSeconds;
  return new Date(ts * 1000).toLocaleString();
}

export function formatTimeRemaining(deadlineUnix: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = deadlineUnix - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400);
  if (days > 0) return `${days}d remaining`;
  const hours = Math.floor(diff / 3600);
  return `${hours}h remaining`;
}
