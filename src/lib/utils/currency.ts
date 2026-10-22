export function formatAvax(amount: string | number | bigint, decimals = 4): string {
  if (typeof amount === "bigint") {
    const ether = Number(amount) / 1e18;
    return ether.toFixed(decimals) + " AVAX";
  }
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.0000 AVAX";
  return num.toFixed(decimals) + " AVAX";
}

export function avaxToWei(amount: string): bigint {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) return BigInt(0);
  return BigInt(Math.floor(parsed * 1e9)) * BigInt(1e9);
}
