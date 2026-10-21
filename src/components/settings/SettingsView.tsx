"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { cn, shortenAddress } from "@/lib/utils";
import { signOut, SUPABASE_ENABLED } from "@/lib/supabase";

const ONBOARDING_KEY = "fundchain_onboarding_done";

export default function SettingsView() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const [userName, setUserName] = useState("");
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(ONBOARDING_KEY);
      if (raw) {
        const { name } = JSON.parse(raw);
        setUserName(name ?? "");
      }
    } catch { /* ignore */ }
  }, []);

  function handleLogout() {
    try { localStorage.removeItem(ONBOARDING_KEY); } catch { /* */ }
    if (SUPABASE_ENABLED) signOut();
    if (isConnected) disconnect();
    window.location.reload();
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full flex-1 bg-zinc-900/95">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h1 className="text-lg font-semibold text-white tracking-tight">Settings</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Profile, wallet &amp; preferences</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">

        {/* ── Profile Section ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Your Profile</h2>
          <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700/40 p-5">
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-orange-500/20 flex-shrink-0">
                {userName ? userName.slice(0, 2).toUpperCase() : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white truncate">{userName || "User"}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isConnected && address
                    ? shortenAddress(address)
                    : "No wallet linked"}
                </p>
              </div>
              {/* Edit button placeholder */}
              <button className="px-3 py-1.5 rounded-lg bg-zinc-700/50 border border-zinc-600/30 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all">
                Edit
              </button>
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
              {isConnected && (
                <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-[10px] font-semibold text-orange-400">
                  Wallet Linked
                </span>
              )}
              {SUPABASE_ENABLED && (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-400">
                  Cloud Sync
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Wallet Section (Optional) ────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Web3 Wallet
            {!isConnected && <span className="ml-1.5 text-zinc-600 normal-case font-normal">· Optional</span>}
          </h2>
          <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700/40 overflow-hidden">
            {isConnected ? (
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Connected</p>
                    <p className="text-xs text-zinc-500 font-mono">{address ? shortenAddress(address) : ""}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-700/30 p-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Balance</p>
                    <p className="text-sm font-bold text-white mt-1">
                      {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-zinc-900/50 border border-zinc-700/30 p-3">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Network</p>
                    <p className="text-sm font-bold text-white mt-1">{chain?.name ?? "Unknown"}</p>
                  </div>
                </div>

                <button
                  onClick={() => disconnect()}
                  className="w-full py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <div className="p-5">
                <div className="text-center mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/15 to-red-500/15 border border-orange-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-orange-400">
                      <rect x="1" y="5" width="22" height="14" rx="3" /><path d="M1 10h22" /><circle cx="17" cy="15" r="1.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-white">Connect Your Wallet</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-[240px] mx-auto">
                    Link a wallet to contribute to fund pools, send AVAX, and participate in lucky draws on Avalanche.
                  </p>
                </div>

                <div className="space-y-2">
                  {connectors.map((connector) => (
                    <button
                      key={connector.uid}
                      onClick={() => connect({ connector })}
                      disabled={isConnecting}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-700/30 text-sm text-zinc-200 font-medium hover:border-orange-500/30 hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-orange-400">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      {connector.name}
                      {isConnecting && (
                        <svg className="animate-spin w-3.5 h-3.5 ml-auto text-zinc-500" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* Explanatory note */}
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Chatting &amp; browsing pools works without a wallet. You only need one for financial transactions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">About</h2>
          <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700/40 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">FundChain</p>
                <p className="text-[11px] text-zinc-500">v1.0.0 — Messaging &amp; Group Funds</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Decentralised group fund collection with integrated messaging. Built on Avalanche C-Chain with Chainlink VRF for verifiable randomness.
            </p>
          </div>
        </section>

        {/* ── Network Configuration ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Network Configuration</h2>
          <div className="space-y-2">
            {[
              { label: "Chat Layer",  network: "Avalanche Fuji Testnet",  badge: "Free",       dot: "bg-emerald-400", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
              { label: "Funds Layer", network: "Avalanche C-Chain",       badge: "Live",       dot: "bg-red-400",     badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/30"  },
              { label: "Randomness",  network: "Chainlink VRF v2.5",      badge: "Verifiable", dot: "bg-violet-400",  badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
            ].map((net) => (
              <div key={net.label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
                <div className="flex items-center gap-2.5">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", net.dot)} />
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{net.label}</p>
                    <p className="text-[11px] text-zinc-500">{net.network}</p>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", net.badgeColor)}>
                  {net.badge}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Danger Zone ──────────────────────────────────────────────── */}
        <section className="pb-8">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Account</h2>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out &amp; Reset Onboarding
          </button>
        </section>
      </div>
    </div>
  );
}
