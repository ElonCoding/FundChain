"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { cn, shortenAddress } from "@/lib/utils";
import { avalancheFuji, avalancheMainnet } from "@/lib/contracts/chains";

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const [open, setOpen] = useState(false);

  const isMainnet = chainId === avalancheMainnet.id;
  const isFuji    = chainId === avalancheFuji.id;
  const isKnown   = isMainnet || isFuji;

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:border-zinc-600 transition-all group"
        >
          {/* Chain dot */}
          <span className={cn(
            "w-2 h-2 rounded-full flex-shrink-0",
            isKnown ? "bg-emerald-400" : "bg-amber-400"
          )} />

          {/* Address */}
          <span className="text-sm font-mono text-zinc-200 font-medium">
            {shortenAddress(address, 4)}
          </span>

          {/* Balance */}
          {balance && (
            <span className="text-xs text-zinc-500 font-medium hidden sm:block">
              {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(3)} {balance.symbol}
            </span>
          )}

          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform", open && "rotate-180")}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-zinc-900 border border-zinc-800/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Connected Wallet</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                    isMainnet ? "bg-red-500/10 text-red-400 border-red-500/30" :
                    isFuji    ? "bg-amber-500/10 text-amber-400 border-amber-500/30" :
                                "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
                  )}>
                    {isMainnet ? "Mainnet" : isFuji ? "Fuji Testnet" : "Unknown"}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="px-4 py-3 space-y-2">
                <div>
                  <p className="text-[10px] text-zinc-500 mb-1">Address</p>
                  <p className="text-xs font-mono text-zinc-300 break-all">{address}</p>
                </div>
                {balance && (
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Balance</p>
                    <p className="text-sm font-bold text-white">
                      {parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6)} {balance.symbol}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-4 py-3 border-t border-zinc-800/60 flex gap-2">
                <a
                  href={`https://${isFuji ? "testnet." : ""}snowtrace.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
                  onClick={() => setOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Explorer
                </a>
                <button
                  onClick={() => { disconnect(); setOpen(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Not connected — show connect button
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <rect x="1" y="5" width="22" height="14" rx="3" /><path d="M1 10h22" /><circle cx="17" cy="15" r="1.5" />
        </svg>
        Connect Wallet
      </button>

      {/* Connector list */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-60 bg-zinc-900 border border-zinc-800/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-4 py-3 border-b border-zinc-800/60">
              <p className="text-xs font-semibold text-zinc-300">Choose a wallet</p>
            </div>
            <div className="px-3 py-3 space-y-1.5">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => { connect({ connector }); setOpen(false); }}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/30 text-sm text-zinc-200 font-medium hover:bg-zinc-800 hover:border-orange-500/30 transition-all disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-400">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  {connector.name}
                  {isPending && <svg className="animate-spin w-3.5 h-3.5 ml-auto text-zinc-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75"/></svg>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
