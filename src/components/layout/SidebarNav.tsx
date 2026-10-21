"use client";

import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import type { ActiveView } from "@/lib/types";

interface SidebarNavProps {
  activeView:   ActiveView;
  onViewChange: (view: ActiveView) => void;
}

const NAV: { view: ActiveView; label: string; icon: React.ReactNode }[] = [
  {
    view: "chats",
    label: "Chats",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    view: "contacts",
    label: "People",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    view: "funds",
    label: "Funds",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" /><path d="M12 18V6" />
      </svg>
    ),
  },
  {
    view: "settings",
    label: "Settings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function SidebarNav({ activeView, onViewChange }: SidebarNavProps) {
  const { address, isConnected } = useAccount();

  // Build profile initial from wallet or use ⚡
  const profileInitial = isConnected && address
    ? address.slice(2, 4).toUpperCase()
    : "FC";

  return (
    <nav
      className="flex flex-col items-center w-[68px] bg-zinc-950 border-r border-zinc-800/50 py-3 gap-0.5 flex-shrink-0"
      aria-label="Main navigation"
    >
      {/* ── App logo ──────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-center">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-400 shadow-lg shadow-orange-500/20 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px] text-white">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* ── Nav items ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0.5 flex-1 w-full px-2">
        {NAV.map(({ view, label, icon }) => (
          <button
            key={view}
            id={`nav-${view}`}
            onClick={() => onViewChange(view)}
            title={label}
            aria-label={label}
            aria-current={activeView === view ? "page" : undefined}
            className={cn(
              "group relative flex flex-col items-center justify-center w-full h-12 rounded-xl transition-all duration-200",
              activeView === view
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
            )}
          >
            {/* Active indicator bar */}
            {activeView === view && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-red-500 to-orange-500 rounded-r-full" />
            )}

            {icon}
            <span className="text-[9px] mt-0.5 font-semibold tracking-wide">{label}</span>

            {/* Funds: active pool badge */}
            {view === "funds" && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center text-white">
                3
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Profile avatar ─────────────────────────────────────────────── */}
      <div className="mt-auto pb-1">
        <button
          onClick={() => onViewChange("settings")}
          title="Profile & Settings"
          aria-label="Open settings"
          className="relative group"
        >
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold",
              "ring-2 transition-all duration-200",
              isConnected
                ? "bg-gradient-to-br from-violet-500 to-indigo-600 ring-zinc-800 group-hover:ring-violet-500/40"
                : "bg-zinc-800 ring-zinc-700 group-hover:ring-zinc-600"
            )}
            suppressHydrationWarning
          >
            {profileInitial}
          </div>

          {/* Online dot when wallet connected */}
          {isConnected && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-950" />
          )}
        </button>
      </div>
    </nav>
  );
}
