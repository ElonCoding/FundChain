"use client";

import { useEffect } from "react";
import { useConnect, useAccount } from "wagmi";
import { cn } from "@/lib/utils";

interface ConnectWalletModalProps {
  /** Why the wallet is needed — shown in the modal */
  reason?: string;
  /** Called when wallet is successfully connected */
  onConnected: () => void;
  /** Called when user dismisses without connecting */
  onDismiss: () => void;
}

export default function ConnectWalletModal({
  reason = "This action requires a connected wallet to sign the transaction.",
  onConnected,
  onDismiss,
}: ConnectWalletModalProps) {
  const { isConnected }                     = useAccount();
  const { connectors, connect, isPending }  = useConnect();

  // Auto-close if wallet gets connected (e.g., user already had one)
  useEffect(() => {
    if (isConnected) onConnected();
  }, [isConnected, onConnected]);

  return (
    /* ── Backdrop ─────────────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />

      {/* ── Sheet / Dialog ──────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm bg-zinc-900 border border-zinc-800/60 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-zinc-800/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-orange-400">
                <rect x="1" y="5" width="22" height="14" rx="3" />
                <path d="M1 10h22" />
                <circle cx="17" cy="15" r="1.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Connect Wallet</p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed max-w-[200px]">{reason}</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0 ml-2"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Connector list */}
        <div className="p-4 space-y-2">
          {connectors.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">
              No wallet extensions detected. Install MetaMask and refresh.
            </p>
          )}
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isPending}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-700/40 hover:bg-zinc-800 hover:border-orange-500/40 transition-all disabled:opacity-60 group"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-orange-400">
                  <rect x="1" y="5" width="22" height="14" rx="3" />
                  <path fill="none" stroke="currentColor" strokeWidth="2" d="M1 10h22" />
                  <circle cx="17" cy="15" r="1.5" />
                </svg>
              </div>

              {/* Label */}
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {connector.name}
                </p>
                <p className="text-[11px] text-zinc-600">Web3 wallet</p>
              </div>

              {/* Chevron / spinner */}
              {isPending ? (
                <svg className="animate-spin w-4 h-4 text-zinc-500 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors flex-shrink-0">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Footer — optional skip */}
        <div className="px-4 pb-5">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              You can chat &amp; browse pools without a wallet. A wallet is only needed to send funds.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="w-full mt-3 py-2.5 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Maybe later — continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}



