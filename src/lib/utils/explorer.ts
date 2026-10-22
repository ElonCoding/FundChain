export function getExplorerTxUrl(txHash: string, isTestnet = true): string {
  const base = isTestnet ? "https://testnet.snowtrace.io" : "https://snowtrace.io";
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, isTestnet = true): string {
  const base = isTestnet ? "https://testnet.snowtrace.io" : "https://snowtrace.io";
  return `${base}/address/${address}`;
}
