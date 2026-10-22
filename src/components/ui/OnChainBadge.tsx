"use client";

import { cn } from "@/lib/utils";

interface OnChainBadgeProps {
  className?: string;
  txHash?: string;
}

export default function OnChainBadge({ className, txHash }: OnChainBadgeProps) {
  const badge = (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-semibold text-emerald-400 font-mono shadow-[0_0_8px_rgba(22,163,74,0.15)]", className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      ✓ On-Chain Verified
    </span>
  );

  if (txHash) {
    return (
      <a
        href={`https://testnet.snowtrace.io/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
      >
        {badge}
      </a>
    );
  }

  return badge;
}
