"use client";

import { type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { avalancheFuji, avalancheMainnet } from "@/lib/contracts/chains";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";

/* ──────────────────────────────────────────────────────────
 *  Wagmi config — Avalanche C-Chain (Fuji Testnet primary)
 *  Chain ID 43113 = Avalanche Fuji C-Chain
 *  Chain ID 43114 = Avalanche Mainnet C-Chain
 * ────────────────────────────────────────────────────────── */

const WALLETCONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ??
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  "";

const connectors = [
  // MetaMask / browser injected (EIP-1193)
  injected({ target: "metaMask" }),
  // Generic injected (any EIP-1193 wallet)
  injected(),
  // Coinbase Wallet — works without extension via SDK
  coinbaseWallet({
    appName: "FundChain",
    appLogoUrl: "https://fundchain.app/logo.png",
  }),
  // WalletConnect v2 — only if project ID is configured
  ...(WALLETCONNECT_PROJECT_ID && WALLETCONNECT_PROJECT_ID !== "your_walletconnect_project_id_here"
    ? [
        walletConnect({
          projectId: WALLETCONNECT_PROJECT_ID,
          metadata: {
            name: "FundChain",
            description: "Decentralised fund pooling on Avalanche Fuji C-Chain",
            url: "https://fundchain.app",
            icons: ["https://fundchain.app/logo.png"],
          },
          showQrModal: true,
        }),
      ]
    : []),
];

export const wagmiConfig = createConfig({
  chains: [avalancheFuji, avalancheMainnet],
  connectors,
  transports: {
    [avalancheFuji.id]:    http("https://api.avax-test.network/ext/bc/C/rpc", { retryCount: 3, retryDelay: 1000 }),
    [avalancheMainnet.id]: http("https://api.avax.network/ext/bc/C/rpc", { retryCount: 3, retryDelay: 1000 }),
  },
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5_000, refetchOnWindowFocus: false },
  },
});

/* ──────────────────────────────────────────────────────────
 *  Provider wrapper
 * ────────────────────────────────────────────────────────── */

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

