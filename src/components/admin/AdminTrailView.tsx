"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { avalancheFuji, avalancheMainnet, CONTRACT_ADDRESSES } from "@/lib/contracts/chains";
import { useAllPools, useContributions } from "@/hooks/useFlexiblePool";
import { shortenAddress } from "@/lib/utils";
import { formatEther } from "viem";
import { cn } from "@/lib/utils";

type ActiveTab = "pools" | "contributions";

export default function AdminTrailView() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { pools, poolCount, isLoading: isPoolsLoading } = useAllPools();
  const { data: rawContributions, isLoading: isContribLoading } = useContributions(BigInt(0), BigInt(50));
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("pools");

  const contractAddress = chainId === avalancheMainnet.id
    ? CONTRACT_ADDRESSES.flexiblePool[avalancheMainnet.id]
    : CONTRACT_ADDRESSES.flexiblePool[avalancheFuji.id];

  const explorerBase = chainId === avalancheMainnet.id
    ? "https://snowtrace.io"
    : "https://testnet.snowtrace.io";

  // Filter pools
  const filteredPools = pools.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      p.creator.toLowerCase().includes(term) ||
      p.id.toString().includes(term)
    );
  });

  // Filter contributions
  const contributions = (rawContributions ?? []).filter((c: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.contributor.toLowerCase().includes(term) ||
      c.poolId.toString().includes(term)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F172A] overflow-hidden">
      {/* Top Bar with Brand Kit Forest Tint */}
      <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-[#0A2E22]/50 via-slate-900/80 to-[#0F172A] backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse shadow-[0_0_8px_#16A34A]" />
            <h1 className="text-lg font-bold text-white tracking-tight">On-Chain Audit Trail &amp; Admin Panel (v2)</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time immutable ledger trail directly queried from Avalanche Fuji.
          </p>
        </div>

        {/* Contract & Explorer pill */}
        <div className="flex items-center gap-3">
          <a
            href={`${explorerBase}/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <span>📜</span> Contract: {shortenAddress(contractAddress, 4)}
            <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total On-Chain Pools</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{poolCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Verified on Avalanche Fuji</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-orange-500/30 transition-all">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Contributions Recorded</p>
          <p className="text-2xl font-bold text-[#F97316] mt-1">{rawContributions ? rawContributions.length : 0}</p>
          <p className="text-[11px] text-slate-500 mt-1">Immutable transaction logs</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-teal-500/30 transition-all">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Connected Admin</p>
          <p className="text-sm font-mono text-slate-200 mt-2 truncate">
            {address ? shortenAddress(address, 6) : "Not Connected"}
          </p>
          <p className="text-[11px] text-teal-300 mt-1">Full Read &amp; Audit Access</p>
        </div>
      </div>

      {/* Audit Table Section */}
      <div className="flex-1 flex flex-col px-6 pb-6 min-h-0">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
          {/* Table Header / Tab Selector */}
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("pools")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
                  activeTab === "pools"
                    ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                    : "text-slate-400 hover:text-white"
                )}
              >
                🏊 Pools Created ({pools.length})
              </button>
              <button
                onClick={() => setActiveTab("contributions")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
                  activeTab === "contributions"
                    ? "bg-orange-500/15 border border-orange-500/40 text-orange-300"
                    : "text-slate-400 hover:text-white"
                )}
              >
                💸 Contributions ({rawContributions ? rawContributions.length : 0})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by wallet, title, or pool ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 w-72"
            />
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "pools" ? (
              isPoolsLoading ? (
                <div className="p-12 text-center text-xs text-slate-500">Loading on-chain pools…</div>
              ) : filteredPools.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <span className="text-3xl mb-2">🔍</span>
                  <p className="text-sm text-slate-400 font-medium">No on-chain pools found</p>
                  <p className="text-xs text-slate-600 mt-1">Create a pool via the dashboard to view it here.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Pool ID</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Creator</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Target / Amount</th>
                      <th className="py-3 px-4">Collected</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredPools.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                          #{p.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                          {p.title}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          <a
                            href={`${explorerBase}/address/${p.creator}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-emerald-400"
                          >
                            {shortenAddress(p.creator, 5)}
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                            p.poolType === "luckydraw"
                              ? "bg-violet-500/10 border-violet-500/25 text-violet-300"
                              : "bg-teal-500/10 border-teal-500/25 text-teal-300"
                          )}>
                            {p.poolType === "luckydraw" ? "🎲 Lucky Draw" : "🎯 Event"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">
                          {p.contributionAmount}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400">
                          {p.totalCollected}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 capitalize">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`${explorerBase}/address/${contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all"
                          >
                            ✓ On-Chain Verified
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              isContribLoading ? (
                <div className="p-12 text-center text-xs text-slate-500">Loading on-chain ledger records…</div>
              ) : contributions.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <span className="text-3xl mb-2">🔍</span>
                  <p className="text-sm text-slate-400 font-medium">No on-chain contributions recorded yet</p>
                  <p className="text-xs text-slate-600 mt-1">Contribute to a pool on Avalanche Fuji to populate this trail.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Pool ID</th>
                      <th className="py-3 px-4">Contributor Wallet</th>
                      <th className="py-3 px-4">Amount (AVAX)</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {contributions.map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[#F97316]">
                          #{c.poolId.toString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">
                          <a
                            href={`${explorerBase}/address/${c.contributor}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-[#F97316]"
                          >
                            {shortenAddress(c.contributor, 6)}
                          </a>
                        </td>
                        <td className="py-3 px-4 font-medium text-white">
                          {parseFloat(formatEther(c.amount)).toFixed(4)} AVAX
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(Number(c.timestamp) * 1000).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                            ✓ On-Chain Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
