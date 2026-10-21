"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { avalancheFuji, avalancheMainnet, CONTRACT_ADDRESSES } from "@/lib/contracts/chains";
import { usePoolCount, useContributions } from "@/hooks/useFlexiblePool";
import { shortenAddress } from "@/lib/utils";
import { formatEther } from "viem";

export default function AdminTrailView() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: poolCount } = usePoolCount();
  const { data: rawContributions, isLoading } = useContributions(BigInt(0), BigInt(50));
  const [searchTerm, setSearchTerm] = useState("");

  const contractAddress = chainId === avalancheMainnet.id
    ? CONTRACT_ADDRESSES.flexiblePool[avalancheMainnet.id]
    : CONTRACT_ADDRESSES.flexiblePool[avalancheFuji.id];

  const explorerBase = chainId === avalancheMainnet.id
    ? "https://snowtrace.io"
    : "https://testnet.snowtrace.io";

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
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Top Bar */}
      <div className="px-6 py-5 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-lg font-bold text-white tracking-tight">On-Chain Audit Trail &amp; Admin Panel (v2)</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time immutable ledger trail directly queried from Avalanche Fuji.
          </p>
        </div>

        {/* Contract & Explorer pill */}
        <div className="flex items-center gap-3">
          <a
            href={`${explorerBase}/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs font-mono text-orange-400 hover:bg-orange-500/20 transition-all"
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
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total On-Chain Pools</p>
          <p className="text-2xl font-bold text-white mt-1">{poolCount ? poolCount.toString() : "0"}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Verified on Avalanche</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Contributions Recorded</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{rawContributions ? rawContributions.length : 0}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Immutable transaction logs</p>
        </div>
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Connected Admin</p>
          <p className="text-sm font-mono text-zinc-200 mt-2 truncate">
            {address ? shortenAddress(address, 6) : "Not Connected"}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">Full Read &amp; Audit Access</p>
        </div>
      </div>

      {/* Search & Audit Table */}
      <div className="flex-1 flex flex-col px-6 pb-6 min-h-0">
        <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-2xl">
          {/* Table Header / Filter */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-white">Transaction &amp; Pool Audit Records</h2>
            <input
              type="text"
              placeholder="Search by wallet address or Pool ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800/80 border border-zinc-700/60 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 w-72"
            />
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-zinc-500">Loading on-chain ledger records…</div>
            ) : contributions.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <span className="text-3xl mb-2">🔍</span>
                <p className="text-sm text-zinc-400 font-medium">No on-chain contributions recorded yet</p>
                <p className="text-xs text-zinc-600 mt-1">Create a pool and contribute on Avalanche Fuji to populate this trail.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Pool ID</th>
                    <th className="py-3 px-4">Contributor Wallet</th>
                    <th className="py-3 px-4">Amount (AVAX)</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                  {contributions.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-orange-400">
                        #{c.poolId.toString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-200">
                        <a
                          href={`${explorerBase}/address/${c.contributor}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline hover:text-orange-400"
                        >
                          {shortenAddress(c.contributor, 6)}
                        </a>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {parseFloat(formatEther(c.amount)).toFixed(4)} AVAX
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
