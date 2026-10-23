"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { cn } from "@/lib/utils";
import type { MockPoolDisplay } from "@/lib/mock-data";
import { getExplorerTxUrl } from "@/lib/contracts/chains";
import ConnectWalletModal from "@/components/ui/ConnectWalletModal";
import { useWalletGate } from "@/hooks/useWalletGate";
import LuckyDrawPanel from "./LuckyDrawPanel";
import AdminPayoutButton from "./AdminPayoutButton";
import { useContribute } from "@/hooks/useFlexiblePool";
import { recordPoolContribution, getPoolMembers, SUPABASE_ENABLED } from "@/lib/supabase";

interface PoolDetailProps {
  pool: MockPoolDisplay;
  onClose: () => void;
}

type TxState = "idle" | "pending" | "confirming" | "success" | "error";

interface Participant {
  address: string;
  name: string;
  amount: string;
  txHash: string;
}

export default function PoolDetail({ pool, onClose }: PoolDetailProps) {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [txState,    setTxState]    = useState<TxState>("idle");
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);
  const [customAmt,  setCustomAmt]  = useState("");
  const [members,    setMembers]    = useState<Participant[]>(pool.participants ?? []);

  /* ── Derive numeric pool ID (strip prefix from FundsDashboard) ───── */
  const rawPoolId = String(pool.id).replace(/^(chain-|mock-)/, "");
  const numericPoolId = isNaN(Number(rawPoolId)) ? 0 : Number(rawPoolId);
  const isMockPool = String(pool.id).startsWith("mock-");

  /* ── Real wagmi write hook ────────────────────────────────────────── */
  const { contribute, hash, isPending, isConfirming, isSuccess, error: writeError, reset } = useContribute();

  /* ── Wait for tx receipt ─────────────────────────────────────────── */
  const { isLoading: isReceiptLoading } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  /* ── Sync wagmi states → local TxState ───────────────────────────── */
  useEffect(() => {
    if (isPending)       setTxState("pending");
    if (isConfirming || isReceiptLoading) setTxState("confirming");
    if (isSuccess && hash) {
      setTxState("success");
      const amountStr = pool.contributionMode === "flexible"
        ? (customAmt || "0") + " AVAX"
        : pool.contributionAmount;
      const amountWei = pool.contributionMode === "flexible"
        ? (parseEther(customAmt || "0")).toString()
        : pool.contributionWei?.toString() ?? "0";

      // Instantly show user in contributors ledger
      if (address) {
        setMembers((prev) => {
          const exists = prev.some((m) => m.address.toLowerCase() === address.toLowerCase());
          if (exists) return prev;
          return [
            ...prev,
            {
              address,
              name: "You",
              amount: amountStr,
              txHash: hash,
            },
          ];
        });
      }

      // Save to Supabase backend
      if (SUPABASE_ENABLED && address) {
        recordPoolContribution({
          poolId:        numericPoolId,
          walletAddress: address,
          amountWei,
          txHash:        hash,
          chainId:       chainId ?? 43113,
        }).then(() => loadMembers());
      }
    }
    if (writeError) {
      // User rejected or tx failed
      const msg = (writeError as Error).message?.includes("User rejected")
        ? "Transaction rejected in wallet."
        : (writeError as Error).message ?? "Transaction failed";
      setErrorMsg(msg);
      setTxState("error");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, isConfirming, isReceiptLoading, isSuccess, writeError, hash]);

  /* ── Load pool members from Supabase ─────────────────────────────── */
  const loadMembers = useCallback(async () => {
    if (!isMockPool && SUPABASE_ENABLED) {
      const data = await getPoolMembers(numericPoolId);
      if (data.length > 0) setMembers(data);
    }
  }, [isMockPool, numericPoolId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  /* ── Core contribute action ───────────────────────────────────────── */
  const doContribute = useCallback(() => {
    setErrorMsg(null);
    if (isMockPool && !isConnected) {
      // Mock pool: simulate for demo when no wallet
      setTxState("pending");
      setTimeout(() => setTxState("confirming"), 1000);
      setTimeout(() => {
        const fakeHash = ("0x" + Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)).join("")) as `0x${string}`;
        setTxState("success");
        setMembers((prev) => [
          ...prev,
          {
            address: address ?? "0x0000",
            name: "You",
            amount: pool.contributionMode === "flexible"
              ? (customAmt || "0") + " AVAX"
              : pool.contributionAmount,
            txHash: fakeHash,
          },
        ]);
      }, 2800);
      return;
    }

    // Real on-chain tx
    const amountWei = pool.contributionMode === "flexible"
      ? parseEther(customAmt || "0")
      : pool.contributionWei ?? BigInt(0);

    if (amountWei <= BigInt(0)) {
      setErrorMsg("Enter a valid AVAX amount.");
      return;
    }

    contribute(BigInt(numericPoolId), amountWei);
  }, [isMockPool, pool, customAmt, contribute, numericPoolId, address]);

  /* ── Wallet gate ─────────────────────────────────────────────────── */
  const gate = useWalletGate(doContribute);

  const goalNum   = parseFloat(pool.goalAmount);
  const collected = parseFloat(pool.totalCollected);
  const progress  = goalNum > 0 ? Math.min((collected / goalNum) * 100, 100) : 0;
  const isActive  = pool.status === "active";
  const isFlexible = pool.contributionMode === "flexible";

  const isCreator = !!address &&
    pool.creatorFull?.toLowerCase() === address.toLowerCase();

  function handleContribute() {
    if (!isConnected) { gate.requireWallet(); return; }
    if (isFlexible && !customAmt) { setErrorMsg("Enter an amount."); return; }
    doContribute();
  }

  function handleRetry() {
    reset?.();
    setTxState("idle");
    setErrorMsg(null);
  }

  const poolTypeBadge = pool.poolType === "luckydraw"
    ? { label: "🎲 Lucky Draw",  cls: "bg-violet-500/15 text-violet-400 border-violet-500/30" }
    : { label: "🎯 Event Payout", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30"   };

  const statusBadge = {
    active:    { label: "● Active",    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    completed: { label: "● Completed", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30"         },
    cancelled: { label: "○ Cancelled", cls: "bg-zinc-700/50 text-zinc-500 border-zinc-600/30"          },
    withdrawn: { label: "✓ Withdrawn", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30"   },
  }[pool.status];

  const explorerBase = (chainId === 43114)
    ? "https://snowtrace.io"
    : "https://testnet.snowtrace.io";

  return (
    <div className="flex flex-col h-full flex-1 bg-zinc-900 animate-in slide-in-from-right-5 duration-300 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800/60 bg-zinc-900/95 backdrop-blur-xl flex-shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white truncate">{pool.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-bold border tracking-wide", poolTypeBadge.cls)}>
              {poolTypeBadge.label}
            </span>
            <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-bold border", statusBadge.cls)}>
              {statusBadge.label}
            </span>
            {isMockPool && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold border bg-zinc-700/30 text-zinc-500 border-zinc-600/20">
                Demo
              </span>
            )}
          </div>
        </div>

        <a
          href={`${explorerBase}/address/${pool.creatorFull}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-[11px] text-zinc-400 hover:text-white hover:border-zinc-600 transition-all flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Explorer
        </a>
      </header>

      {/* ── Scrollable body ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">

        <p className="text-sm text-zinc-400 leading-relaxed">{pool.description}</p>

        {/* Progress card */}
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700/40 p-5">
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">
                {pool.poolType === "luckydraw" ? "Prize Pot" : "Total Collected"}
              </p>
              <p className="text-3xl font-bold text-white">{pool.totalCollected}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Goal</p>
              <p className="text-base font-semibold text-zinc-400">{pool.goalAmount}</p>
            </div>
          </div>

          <div className="relative h-3 rounded-full bg-zinc-700/60 overflow-hidden mb-3">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out",
                pool.poolType === "luckydraw"
                  ? "bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-500"
                  : "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">{Math.round(progress)}% funded</span>
            <span className="text-zinc-500">{pool.participantCount}/{pool.maxParticipants} participants</span>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Per Person",
              value: isFlexible
                ? `Flexible (min ${pool.minContributionWei > BigInt(0)
                    ? (Number(pool.minContributionWei) / 1e18).toFixed(3)
                    : "0"} AVAX)`
                : pool.contributionAmount,
              emoji: "💰"
            },
            { label: "Deadline",  value: pool.deadline ?? "No deadline",        emoji: "⏰" },
            { label: "Pool ID",   value: `#${numericPoolId}`,                   emoji: "🔗" },
            { label: "Pool Type", value: pool.poolType === "luckydraw" ? "Lucky Draw" : "Event Payout", emoji: "📊" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 p-3.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{item.emoji} {item.label}</p>
              <p className="text-sm font-semibold text-zinc-200">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Lucky Draw Panel */}
        {pool.poolType === "luckydraw" && (
          <LuckyDrawPanel pool={pool} isCreator={isCreator} />
        )}

        {/* ── Contribute CTA ──────────────────────────────────────────── */}
        {isActive && pool.poolType !== "luckydraw" && (
          <div className="space-y-3">

            {/* Idle: not connected */}
            {txState === "idle" && !isConnected && (
              <div className="space-y-2">
                {isFlexible && (
                  <div className="relative">
                    <input
                      type="number" step="0.001"
                      min={pool.minContributionWei > BigInt(0) ? Number(pool.minContributionWei) / 1e18 : 0}
                      value={customAmt}
                      onChange={(e) => setCustomAmt(e.target.value)}
                      placeholder={`Min: ${(Number(pool.minContributionWei) / 1e18).toFixed(3)} AVAX`}
                      className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400">AVAX</span>
                  </div>
                )}
                <button
                  onClick={gate.requireWallet}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm hover:shadow-xl hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <rect x="1" y="5" width="22" height="14" rx="3"/><path d="M1 10h22"/><circle cx="17" cy="15" r="1.5"/>
                  </svg>
                  Connect Wallet &amp; Contribute
                </button>
                <p className="text-[10px] text-zinc-600 text-center">MetaMask popup will appear to confirm the transaction</p>
              </div>
            )}

            {/* Idle: connected */}
            {txState === "idle" && isConnected && (
              <div className="space-y-2">
                {isFlexible && (
                  <div className="relative">
                    <input
                      type="number" step="0.001"
                      min={pool.minContributionWei > BigInt(0) ? Number(pool.minContributionWei) / 1e18 : 0}
                      max={pool.maxContributionWei > BigInt(0) ? Number(pool.maxContributionWei) / 1e18 : undefined}
                      value={customAmt}
                      onChange={(e) => { setCustomAmt(e.target.value); setErrorMsg(null); }}
                      placeholder={`Min: ${(Number(pool.minContributionWei) / 1e18).toFixed(3)} AVAX`}
                      className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400">AVAX</span>
                  </div>
                )}
                {errorMsg && <p className="text-xs text-red-400 px-1">{errorMsg}</p>}
                <button
                  id="contribute-btn"
                  onClick={handleContribute}
                  disabled={isFlexible && !customAmt}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm hover:shadow-xl hover:shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Pay {isFlexible ? (customAmt ? `${customAmt} AVAX` : "Custom Amount") : pool.contributionAmount} &amp; Join Group
                </button>
                <p className="text-[11px] text-zinc-600 text-center">
                  MetaMask will open to confirm — tx recorded on Avalanche Fuji C-Chain
                </p>
              </div>
            )}

            {/* Pending — MetaMask open */}
            {txState === "pending" && (
              <div className="w-full py-4 rounded-2xl bg-zinc-800 border border-zinc-700/50 text-zinc-400 font-bold text-sm flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2.5">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
                  </svg>
                  Waiting for MetaMask…
                </div>
                <p className="text-[11px] text-zinc-600 font-normal">Check your wallet for the confirmation popup</p>
              </div>
            )}

            {/* Confirming on-chain */}
            {txState === "confirming" && (
              <div className="w-full py-4 rounded-2xl bg-zinc-800 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2.5">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/>
                  </svg>
                  Confirming on Avalanche Fuji…
                </div>
                {hash && (
                  <a
                    href={getExplorerTxUrl(chainId ?? 43113, hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-zinc-500 hover:text-emerald-400 font-mono underline transition-colors"
                  >
                    {hash.slice(0, 18)}… ↗
                  </a>
                )}
              </div>
            )}

            {/* Success */}
            {txState === "success" && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-400">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-emerald-300 mb-1">Contribution Confirmed! 🎉</p>
                <p className="text-xs text-zinc-500 mb-3">
                  Added to group · Hash saved to Supabase · Visible on SnowTrace
                </p>
                {hash && (
                  <a
                    href={getExplorerTxUrl(chainId ?? 43113, hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-400 hover:text-emerald-400 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View on SnowTrace →
                  </a>
                )}
              </div>
            )}

            {/* Error */}
            {txState === "error" && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                <p className="text-sm font-semibold text-red-400 mb-1">Transaction Failed</p>
                <p className="text-xs text-zinc-500 mb-3">{errorMsg}</p>
                <button onClick={handleRetry} className="text-xs text-emerald-400 underline">Try again</button>
              </div>
            )}

          </div>
        )}

        {/* Admin actions */}
        {isCreator && isActive && pool.poolType === "event" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Admin Actions</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <AdminPayoutButton pool={pool} />
          </div>
        )}

        {/* ── Contributors Ledger ───────────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-400">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            {pool.poolType === "luckydraw" ? "Entrants" : "Contributors"} ({members.length})
            <span className="text-[10px] text-zinc-500 font-normal ml-auto">
              {isMockPool ? "Demo data" : "Supabase · on-chain verified"}
            </span>
          </h3>

          {members.length === 0 ? (
            <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 px-4 py-8 text-center">
              <p className="text-sm text-zinc-500">
                {pool.poolType === "luckydraw" ? "No entrants yet. Be the first!" : "No contributors yet. Be the first!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((p, i) => (
                <div
                  key={`${p.address}-${i}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30 hover:border-zinc-600/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-[11px] font-bold text-emerald-400 flex-shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-zinc-200">{p.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{p.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-400">{p.amount}</p>
                    {p.txHash && (
                      <a
                        href={`${explorerBase}/tx/${p.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-zinc-600 hover:text-emerald-400 transition-colors font-mono flex items-center gap-1 justify-end"
                      >
                        {p.txHash.slice(0, 10)}…
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>{/* end scrollable body */}

      {/* Wallet connect modal */}
      {gate.show && (
        <ConnectWalletModal
          reason={`Connect your wallet to contribute ${pool.contributionAmount} and join this pool on Avalanche Fuji.`}
          {...gate.modalProps}
        />
      )}
    </div>
  );
}
