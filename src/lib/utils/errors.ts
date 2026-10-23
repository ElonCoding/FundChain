/**
 * Parse a wagmi/viem/ethers contract error into a human-readable message.
 */
export function parseContractError(error: unknown): string {
  if (!error) return "Unknown error";
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("user rejected"))      return "Transaction rejected by wallet.";
  if (msg.includes("insufficient funds")) return "Insufficient AVAX balance.";
  if (msg.includes("Pool is full"))       return "This pool has reached its member limit.";
  if (msg.includes("Already a member"))   return "You are already a member of this pool.";
  if (msg.includes("Pool not active"))    return "This pool is no longer accepting contributions.";
  if (msg.includes("Amount too low"))     return "Contribution amount is below the pool minimum.";
  if (msg.includes("execution reverted")) {
    const inner = msg.match(/execution reverted: (.+?)(?:\s*\(|$)/)?.[1];
    return inner ? `Contract error: ${inner}` : "Transaction reverted by contract.";
  }
  if (msg.includes("network"))            return "Network error â€” check your connection and try again.";
  if (msg.length > 120)                   return msg.slice(0, 120) + "...";
  return msg;
}

