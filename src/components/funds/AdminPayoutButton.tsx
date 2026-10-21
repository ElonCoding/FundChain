"use client";

import { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { getExplorerTxUrl } from "@/lib/contracts/chains";
import type { MockPoolDisplay } from "@/lib/mock-data";

interface AdminPayoutButtonProps {
  pool: MockPoolDisplay;
}

type TxPhase = "idle" | "confirm" | "pending" | "confirming" | "success" | "error";

export default function AdminPayoutButton({ pool }: AdminPayoutButtonProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const [phase, setPhase]         = useState<TxPhase>("idle");
  const [recipient, setRecipient] = useState(pool.recipientAddress || "");
  const [txHash, setTxHash]       = useState<string | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  async function handlePayout() {
    if (!isConnected || !recipient) return;
    setPhase("pending");
    setErrorMsg(null);

    try {
      // In production: call usePayoutToRecipient(BigInt(pool.id), recipient)
      await new Promise((r) => setTimeout(r, 1200));   // wallet popup
      setPhase("confirming");
      await new Promise((r) => setTimeout(r, 2500));   // chain confirmation
      const hash = "0x" + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)).join("");
      setTxHash(hash);
      setPhase("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Transaction failed");
      setPhase("error");
    }
  }

  // ── Idle: show "Transfer Funds" button ─────────────────────────────────
  if (phase === "idle") {
    return (
      <button
        id="admin-payout-btn"
        onClick={() => setPhase("confirm")}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-sm hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        Transfer Funds to Recipient
      </button>
    );
  }

  // ── Confirm modal ──────────────────────────────────────────────────────
  if (phase === "confirm") {
    return (
      <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-indigo-400">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Confirm Payout</p>
            <p className="text-[10px] text-zinc-500">Sending {pool.totalCollected} on-chain</p>
          </div>
        </div>

        {/* Recipient address field */}
        <div>
          <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
            Recipient Wallet Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full bg-zinc-800/80 border border-zinc-700/50 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
          />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Amount",  value: pool.totalCollected },
            { label: "Network", value: "Avalanche C-Chain" },
          ].map((row) => (
            <div key={row.label} className="rounded-xl bg-zinc-800/50 border border-zinc-700/30 px-3 py-2">
              <p className="text-[10px] text-zinc-500 mb-0.5">{row.label}</p>
              <p className="text-xs font-bold text-white truncate">{row.value}</p>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setPhase("idle")}
            className="flex-1 py-2 rounded-xl border border-zinc-700/50 text-xs text-zinc-400 font-medium hover:bg-zinc-800 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handlePayout}
            disabled={!recipient || !recipient.startsWith("0x")}
            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm &amp; Send
          </button>
        </div>
      </div>
    );
  }

  // ── Pending / confirming ────────────────────────────────────────────────
  if (phase === "pending" || phase === "confirming") {
    return (
      <div className="w-full py-3.5 rounded-2xl bg-zinc-800 border border-zinc-700/50 text-zinc-400 font-bold text-sm flex items-center justify-center gap-2.5">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
        </svg>
        {phase === "pending" ? "Waiting for wallet…" : "Confirming on Avalanche…"}
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center space-y-2 animate-in fade-in duration-300">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="text-sm font-bold text-emerald-300">Funds Transferred! 🎉</p>
        <p className="text-xs text-zinc-500">
          <span className="text-white font-medium">{pool.totalCollected}</span> sent to{" "}
          <span className="text-emerald-400 font-mono text-[10px]">{recipient.slice(0, 10)}…</span>
        </p>
        {txHash && (
          <a
            href={getExplorerTxUrl(chainId, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-400 hover:text-orange-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Txn on SnowTrace →
          </a>
        )}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
      <p className="text-xs font-semibold text-red-400 mb-1">Payout failed</p>
      <p className="text-xs text-zinc-500 mb-2">{errorMsg}</p>
      <button onClick={() => { setPhase("idle"); setErrorMsg(null); }} className="text-xs text-orange-400 underline">
        Try again
      </button>
    </div>
  );
}
