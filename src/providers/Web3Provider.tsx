"use client";

import { type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { avalancheFuji, avalancheMainnet } from "@/lib/contracts/chains";
import { injected, walletConnect } from "wagmi/connectors";

/* ──────────────────────────────────────────────────────────
 *  Wagmi config — Avalanche Mainnet + Fuji Testnet
 * ────────────────────────────────────────────────────────── */

const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

export const wagmiConfig = createConfig({
  chains: [avalancheFuji, avalancheMainnet],
  connectors: [
    injected(),
    ...(WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: WALLETCONNECT_PROJECT_ID,
            metadata: {
              name: "FundChain",
              description: "Decentralised fund pooling on Avalanche",
              url: "https://fundchain.app",
              icons: ["https://fundchain.app/icon.png"],
            },
          }),
        ]
      : []),
  ],
  transports: {
    [avalancheFuji.id]: http(),
    [avalancheMainnet.id]: http(),
  },
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
