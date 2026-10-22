"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useCreateEventPool, useCreateLuckyDrawPool } from "@/hooks/useFlexiblePool";

interface CreatePoolModalProps {
  onClose: () => void;
}

type PoolTypeChoice  = "event" | "luckydraw";
type ContribMode     = "fixed" | "flexible";
type SubmitPhase     = "idle" | "deploying" | "success" | "error";

export default function CreatePoolModal({ onClose }: CreatePoolModalProps) {
  // ── Pool type & contribution mode ──────────────────────────────────────
  const [poolType,       setPoolType]       = useState<PoolTypeChoice>("event");
  const [contribMode,    setContribMode]    = useState<ContribMode>("fixed");

  // ── Form fields ────────────────────────────────────────────────────────
  const [title,          setTitle]          = useState("");
  const [description,    setDescription]    = useState("");
  const [fixedAmount,    setFixedAmount]    = useState("");
  const [minAmount,      setMinAmount]      = useState("");
  const [maxAmount,      setMaxAmount]      = useState("");
  const [goalAmount,     setGoalAmount]     = useState("");
  const [deadline,       setDeadline]       = useState("");
  const [recipientAddr,  setRecipientAddr]  = useState("");

  // ── Real On-Chain Hooks ────────────────────────────────────────────────
  const { createEventPool, hash: eventHash, isPending: eventPending, isConfirming: eventConfirming, isSuccess: eventSuccess, error: eventError } = useCreateEventPool();
  const { createLuckyDrawPool, hash: drawHash, isPending: drawPending, isConfirming: drawConfirming, isSuccess: drawSuccess, error: drawError } = useCreateLuckyDrawPool();
  const { isConnected } = useAccount();

  const isDeploying = eventPending || eventConfirming || drawPending || drawConfirming;
  const currentHash = eventHash || drawHash;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      const deadlineSec = deadline ? Math.floor(new Date(deadline).getTime() / 1000) : 0;
      const grpId = "group-" + Date.now();

      if (poolType === "event") {
        createEventPool({
          title,
          description,
          groupId: grpId,
          contributionAmount: contribMode === "fixed" ? fixedAmount : "",
          minContribution: contribMode === "flexible" ? minAmount : "0",
          maxContribution: contribMode === "flexible" && maxAmount ? maxAmount : "0",
          recipientAddress: (recipientAddr as `0x${string}`) || "",
          deadline: deadlineSec,
        });
      } else {
        createLuckyDrawPool({
          title,
          description,
          groupId: grpId,
          contributionAmount: contribMode === "fixed" ? fixedAmount : "",
          minContribution: contribMode === "flexible" ? minAmount : "0",
          maxContribution: contribMode === "flexible" && maxAmount ? maxAmount : "0",
          deadline: deadlineSec,
        });
      }
    } catch (err) {
      console.error("Deploy error:", err);
    }
  }

  const isValid = title.trim() &&
    (contribMode === "fixed" ? !!fixedAmount : !!minAmount);

  // ── Pool type cards ────────────────────────────────────────────────────
  const poolTypeOptions: { id: PoolTypeChoice; label: string; desc: string; icon: string; color: string }[] = [
    {
      id: "event",
      label: "Event Payout",
      desc: "Collect funds and transfer to a recipient address (e.g. birthday gift, trip fund)",
      icon: "🎯",
      color: "border-blue-500/40 bg-blue-500/8",
    },
    {
      id: "luckydraw",
      label: "Lucky Draw",
      desc: "Participants enter; one random winner takes the full prize pot",
      icon: "🎲",
      color: "border-violet-500/40 bg-violet-500/8",
    },
  ];

  // ── Success screen ─────────────────────────────────────────────────────
  if (eventSuccess || drawSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative w-full max-w-sm mx-4 bg-zinc-900 border border-zinc-800/60 rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in-95 fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-emerald-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Pool Deployed On-Chain! 🚀</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Your {poolType === "luckydraw" ? "Lucky Draw" : "Event"} pool &quot;{title}&quot; is confirmed on Avalanche Fuji.
          </p>
          {currentHash && (
            <a
              href={`https://testnet.snowtrace.io/tx/${currentHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-xs text-orange-400 hover:text-orange-300 transition-all mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              View On-Chain Tx on SnowTrace
            </a>
          )}
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-zinc-800 border border-zinc-700/50 text-sm text-zinc-300 font-medium hover:bg-zinc-700 transition-all">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-zinc-900 border border-zinc-800/60 rounded-2xl shadow-2xl shadow-black/50 animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">Create Fund Pool</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Deploy on Avalanche C-Chain</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">

          {/* ── Step 1: Pool Type ──────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Pool Type</label>
            <div className="grid grid-cols-2 gap-2">
              {poolTypeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPoolType(opt.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    poolType === opt.id
                      ? opt.color + " ring-1 ring-inset ring-white/10"
                      : "border-zinc-700/40 bg-zinc-800/40 hover:border-zinc-600"
                  )}
                >
                  <span className="text-xl block mb-1.5">{opt.icon}</span>
                  <p className="text-xs font-bold text-white mb-0.5">{opt.label}</p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 2: Basic info ─────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Pool Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={poolType === "luckydraw" ? "e.g., Sports Day Lucky Draw 🎲" : "e.g., Teacher's Birthday Gift 🎂"}
              required
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this pool for?"
              rows={2}
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all resize-none"
            />
          </div>

          {/* ── Step 3: Contribution mode ──────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Contribution Mode</label>
            <div className="flex gap-2">
              {(["fixed", "flexible"] as ContribMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setContribMode(mode)}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-xs font-semibold transition-all capitalize",
                    contribMode === mode
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                      : "border-zinc-700/40 bg-zinc-800/40 text-zinc-500 hover:border-zinc-600"
                  )}
                >
                  {mode === "fixed" ? "🔒 Fixed Amount" : "🎚️ Flexible Range"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Contribution amount fields ─────────────────────────────── */}
          {contribMode === "fixed" ? (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contribution Amount (AVAX) *</label>
              <div className="relative">
                <input
                  type="number" step="0.001" min="0.001"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  placeholder="0.1"
                  required
                  className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-400">AVAX</span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">
                Equivalent ≈ ₹{fixedAmount ? (parseFloat(fixedAmount) * 3200).toFixed(0) : "0"} INR at current rates
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Min Amount (AVAX) *</label>
                <div className="relative">
                  <input
                    type="number" step="0.001" min="0.001"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    placeholder="0.05"
                    required
                    className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-orange-400">AVAX</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Max Amount (AVAX)</label>
                <div className="relative">
                  <input
                    type="number" step="0.001"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    placeholder="∞ (unlimited)"
                    className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-orange-400">AVAX</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Recipient (Event pools only) ───────────────────────────── */}
          {poolType === "event" && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Recipient Address <span className="text-zinc-600">(optional — defaults to your wallet)</span>
              </label>
              <input
                type="text"
                value={recipientAddr}
                onChange={(e) => setRecipientAddr(e.target.value)}
                placeholder="0x... (leave blank = creator wallet)"
                className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
            </div>
          )}

          {/* ── Goal + Deadline ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Goal (AVAX)</label>
              <div className="relative">
                <input
                  type="number" step="0.1"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  placeholder="0 = unlimited"
                  className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-orange-400">AVAX</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
              />
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-500/5 border border-orange-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {poolType === "luckydraw"
                ? "A Lucky Draw pool will randomly select one winner on-chain using Avalanche block data. Winner receives 100% of the prize pot. Only the creator can trigger the draw."
                : "An Event pool collects funds from all contributors and lets the creator transfer the full amount to any recipient wallet, verified transparently on SnowTrace."}
            </p>
          </div>
        </form>

        {/* Footer actions — outside scrollable area */}
        <div className="px-6 py-4 border-t border-zinc-800/60 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-700/50 text-sm text-zinc-400 font-medium hover:bg-zinc-800 hover:text-white transition-all"
          >
            Cancel
          </button>
          {eventError || drawError ? (
            <p className="text-xs text-red-400 w-full text-center">
              {(eventError || drawError)?.message.slice(0, 100)}…
            </p>
          ) : null}
          <button
            onClick={handleSubmit}
            disabled={isDeploying || !isValid}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 text-slate-950 text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {eventConfirming || drawConfirming ? "Confirming On-Chain…" : "Signing Tx in Wallet…"}
              </>
            ) : poolType === "luckydraw" ? "🎲 Create Lucky Draw" : "🎯 Create Event Pool"}
          </button>
        </div>
      </div>
    </div>
  );
}
