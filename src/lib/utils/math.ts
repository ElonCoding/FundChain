export function calculateFundingPercent(collected: string | number, goal: string | number): number {
  const c = typeof collected === "string" ? parseFloat(collected) : collected;
  const g = typeof goal === "string" ? parseFloat(goal) : goal;
  if (!g || g <= 0) return 0;
  return Math.min(Math.round((c / g) * 100), 100);
}
