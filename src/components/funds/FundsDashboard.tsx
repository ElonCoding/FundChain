"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MOCK_POOLS, type MockPoolDisplay } from "@/lib/mock-data";
import { useAllPools } from "@/hooks/useFlexiblePool";
import PoolCard from "./PoolCard";
import PoolDetail from "./PoolDetail";
import CreatePoolModal from "./CreatePoolModal";

type FilterStatus = "all" | "active" | "completed";

export default function FundsDashboard() {
  const [selectedPool,    setSelectedPool]    = useState<MockPoolDisplay | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus,    setFilterStatus]    = useState<FilterStatus>("all");

  const { pools: onChainPools, poolCount, isLoading: isChainLoading, refetch } = useAllPools();

  // Merge real on-chain pools first, then fallback mock pools
  const allAvailablePools: MockPoolDisplay[] = [
    ...(onChainPools as unknown as MockPoolDisplay[]),
    ...MOCK_POOLS,
  ];

  const filteredPools = allAvailablePools.filter((p) =>
    filterStatus === "all" ? true : p.status === filterStatus
  );

  const totalPools       = allAvailablePools.length;
  const activePools      = allAvailablePools.filter((p) => p.status === "active").length;
  const completedPools   = allAvailablePools.filter((p) => p.status === "completed").length;
  const onChainCount     = onChainPools.length;

  return (
    <div className="flex h-full flex-1 overflow-hidden">

      {/* ── Pool list panel ─────────────────────────────────────────────── */}
      <div className={cn(
        "flex flex-col h-full bg-slate-950/95 border-r border-slate-800/60 flex-shrink-0 transition-all duration-300",
        selectedPool ? "w-[380px]" : "flex-1 max-w-none"
      )}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0 border-b border-slate-800/50 bg-gradient-to-b from-[#0A2E22]/30 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold text-white tracking-tight">Funds &amp; Vault Pools</h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                  Fuji v2
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Transparent on-chain decentralized funding</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                title="Refresh on-chain pools"
                className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
              >
                <svg className={cn("w-3.5 h-3.5", isChainLoading && "animate-spin text-emerald-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                id="new-pool-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 text-slate-950 text-xs font-bold hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-slate-950">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Pool
              </button>
            </div>
          </div>

          {/* Compact stat pills */}
          <div className="flex gap-2">
            {[
              { label: "On-Chain",   value: onChainCount,       color: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" },
              { label: "Active",     value: activePools,        color: "bg-teal-500/10 border-teal-500/20 text-teal-300" },
              { label: "Total",      value: totalPools,         color: "bg-slate-800/60 border-slate-700/40 text-slate-300" },
              { label: "Verified",   value: "100%",             color: "bg-orange-500/10 border-orange-500/25 text-[#F97316]" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={cn("flex-1 flex flex-col items-center justify-center py-2 px-2 rounded-xl border text-center", stat.color)}
              >
                <p className={cn("text-sm font-bold tabular-nums")}>{stat.value}</p>
                <p className="text-[9px] font-medium uppercase tracking-wider mt-0.5 opacity-70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 px-5 py-3 flex-shrink-0">
          {(["all", "active", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-3 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize",
                filterStatus === status
                  ? "bg-zinc-800 text-white border border-zinc-700/50"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {status === "all" ? "All Pools" : status === "active" ? "🟢 Active" : "✅ Completed"}
            </button>
          ))}
        </div>

        {/* Pool list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {filteredPools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              isSelected={selectedPool?.id === pool.id}
              onClick={() => setSelectedPool(selectedPool?.id === pool.id ? null : pool)}
            />
          ))}
          {filteredPools.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-zinc-600">
                  <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-400">No pools yet</p>
              <p className="text-xs text-zinc-600 mt-1">Create your first fund pool to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300 hover:text-white hover:border-orange-500/40 transition-all"
              >
                + Create Pool
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Pool detail panel ────────────────────────────────────────────── */}
      {selectedPool && (
        <PoolDetail pool={selectedPool} onClose={() => setSelectedPool(null)} />
      )}

      {/* ── Create pool modal ────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreatePoolModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
