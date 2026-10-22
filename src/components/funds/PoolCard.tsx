"use client";

import { cn } from "@/lib/utils";
import type { MockPoolDisplay } from "@/lib/mock-data";

interface PoolCardProps {
  pool: MockPoolDisplay;
  isSelected: boolean;
  onClick: () => void;
}

const statusStyles = {
  active:    { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  completed: { bg: "bg-blue-500/10 border-blue-500/30",       text: "text-blue-400",    dot: "bg-blue-400"    },
  cancelled: { bg: "bg-red-500/10 border-red-500/30",         text: "text-red-400",     dot: "bg-red-400"     },
  withdrawn: { bg: "bg-zinc-500/10 border-zinc-500/30",       text: "text-zinc-400",    dot: "bg-zinc-400"    },
};

const poolTypeStyles = {
  event:     { label: "🎯 Event",       cls: "bg-blue-500/10 text-blue-400 border-blue-500/25"     },
  luckydraw: { label: "🎲 Lucky Draw", cls: "bg-violet-500/10 text-violet-400 border-violet-500/25" },
};

export default function PoolCard({ pool, isSelected, onClick }: PoolCardProps) {
  const progress = pool.goalAmount !== "0"
    ? (parseFloat(pool.totalCollected) / parseFloat(pool.goalAmount)) * 100
    : 0;

  const style     = statusStyles[pool.status];
  const typeStyle = poolTypeStyles[pool.poolType];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border transition-all duration-200 p-4 group relative overflow-hidden",
        isSelected
          ? "bg-slate-900/90 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
          : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-emerald-500/30"
      )}
    >
      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
          {pool.title}
        </h3>
        <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize flex-shrink-0", style.bg, style.text)}>
          <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
          {pool.status}
        </span>
      </div>

      {/* Pool type chip + On-Chain tag */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border", typeStyle.cls)}>
          {typeStyle.label}
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono">
          ✓ On-Chain
        </span>
      </div>

      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{pool.description}</p>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-300 font-medium">{pool.totalCollected} collected</span>
          <span className="text-slate-500">Goal: {pool.goalAmount}</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#6EE7B7]"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/40">
        <span className="text-slate-500">
          <span className="text-slate-300 font-medium">{pool.participantCount}</span>/{pool.maxParticipants} joined
        </span>
        <span className="font-semibold text-emerald-400">
          {pool.contributionMode === "flexible"
            ? `≥ ${(Number(pool.minContributionWei) / 1e18).toFixed(2)} AVAX`
            : `${pool.contributionAmount} / person`}
        </span>
      </div>
    </button>
  );
}
