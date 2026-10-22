export function parseContractError(error: any): string {
  if (!error) return "Unknown error occurred.";
  const msg = error.shortMessage || error.message || String(error);
  if (msg.includes("User rejected")) return "Transaction rejected by user.";
  if (msg.includes("insufficient funds")) return "Insufficient AVAX for gas.";
  return msg;
}
