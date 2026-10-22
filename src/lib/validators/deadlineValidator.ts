export function isValidFutureDeadline(dateStr: string): boolean {
  const target = new Date(dateStr).getTime();
  return !isNaN(target) && target > Date.now();
}
