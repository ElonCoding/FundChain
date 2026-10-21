import { defineChain } from "viem";

/* ──────────────────────────────────────────────────────────
 *  Avalanche Chain Definitions
 * ────────────────────────────────────────────────────────── */

export const avalancheMainnet = defineChain({
  id: 43114,
  name: "Avalanche C-Chain",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "SnowTrace", url: "https://snowtrace.io" },
  },
});

export const avalancheFuji = defineChain({
  id: 43113,
  name: "Avalanche Fuji Testnet",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "SnowTrace Testnet", url: "https://testnet.snowtrace.io" },
  },
  testnet: true,
});

/* ──────────────────────────────────────────────────────────
 *  Contract Addresses  (update after deployment)
 * ────────────────────────────────────────────────────────── */

export const CONTRACT_ADDRESSES = {
  fundPool: {
    [avalancheMainnet.id]: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    [avalancheFuji.id]:    "0xf838734D3655776AF116B3f41256EaEbFb8cD864" as `0x${string}`,
  },
  flexiblePool: {
    [avalancheMainnet.id]: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    [avalancheFuji.id]:    "0x54A39697E45a7dC7d6DC7e43B3cDAF8Cd71cBC43" as `0x${string}`,
  },
} as const;


/* ──────────────────────────────────────────────────────────
 *  Explorer helpers
 * ────────────────────────────────────────────────────────── */

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const base =
    chainId === avalancheMainnet.id
      ? "https://snowtrace.io"
      : "https://testnet.snowtrace.io";
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  const base =
    chainId === avalancheMainnet.id
      ? "https://snowtrace.io"
      : "https://testnet.snowtrace.io";
  return `${base}/address/${address}`;
}
