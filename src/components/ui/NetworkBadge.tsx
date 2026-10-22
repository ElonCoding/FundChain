"use client";

import { useChainId } from "wagmi";

export default function NetworkBadge() {
  const chainId = useChainId();
  const isFuji = chainId === 43113;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300">
      <span className="text-[#F97316]">🔺</span>
      {isFuji ? "Avalanche Fuji Testnet" : "Avalanche C-Chain"}
    </span>
  );
}
