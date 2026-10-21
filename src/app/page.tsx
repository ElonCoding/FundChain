"use client";

import { useState, useEffect } from "react";
import SidebarNav       from "@/components/layout/SidebarNav";
import ChatList         from "@/components/chat/ChatList";
import ChatWindow       from "@/components/chat/ChatWindow";
import FundsDashboard   from "@/components/funds/FundsDashboard";
import ContactsView     from "@/components/contacts/ContactsView";
import SettingsView     from "@/components/settings/SettingsView";
import OnboardingScreen from "@/components/onboarding/OnboardingScreen";
import CallModal, { type CallType } from "@/components/ui/CallModal";
import { useConversations, useProfile } from "@/hooks/useSupabaseChat";
import { useAccount } from "wagmi";
import type { ActiveView } from "@/lib/types";

const ONBOARDING_KEY = "fundchain_onboarding_done";

export default function Home() {

  // ── Onboarding state ───────────────────────────────────────────────────
  const [onboardingDone,  setOnboardingDone]  = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [mounted,         setMounted]         = useState(false);

  // Hydration-safe: read localStorage only after mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(ONBOARDING_KEY);
      if (saved) {
        const { name } = JSON.parse(saved);
        setUserDisplayName(name ?? "");
        setOnboardingDone(true);
      }
    } catch {
      /* ignore parse errors */
    }
  }, []);

  function handleOnboardingComplete(name: string, phone?: string) {
    setUserDisplayName(name);
    setOnboardingDone(true);
    try {
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify({ name, phone }));
    } catch { /* ignore */ }
  }

  // ── App navigation state ───────────────────────────────────────────────
  const [activeView,   setActiveView]   = useState<ActiveView>("chats");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // ── Call modal state ───────────────────────────────────────────────────
  const [call, setCall] = useState<{ name: string; type: CallType } | null>(null);

  // ── Supabase: resolve conversation metadata for the active chat ────────
  const { address } = useAccount();
  const { profile } = useProfile(address ?? null);
  const { conversations } = useConversations(profile?.id ?? null, activeChatId);

  const activeConv = conversations.find((c) => c.id === activeChatId) ?? null;

  // Derive display name: for private chats show the other party's name
  const activeChatName = activeConv
    ? activeConv.type === "private"
      ? (activeConv.participants.find((p) => p.id !== profile?.id)?.display_name ?? activeConv.name)
      : activeConv.name
    : (activeChatId ?? "");

  const chatProps = activeChatId
    ? {
        chatId:   activeChatId,
        chatName: activeChatName,
        chatType: (activeConv?.type ?? "group") as "private" | "group" | "fund-group",
        poolType: activeConv?.pool_type ?? null,
        onVoiceCall: (name: string) => setCall({ name, type: "voice" }),
        onVideoCall: (name: string) => setCall({ name, type: "video" }),
      }
    : null;

  // ── Don't render until mounted (avoid hydration mismatch) ─────────────
  if (!mounted) return null;

  // ── Show onboarding for new users ─────────────────────────────────────
  if (!onboardingDone) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <main className="flex flex-col h-screen w-screen bg-zinc-950 overflow-hidden">

      {/* ── App header ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800/50">
        {/* Brand wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/25 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="leading-none">
            <p className="text-[15px] font-bold text-white tracking-tight">FundChain</p>
            <p className="text-[10px] text-zinc-500 mt-px">Messaging &amp; Group Funds</p>
          </div>
        </div>

        {/* Right side: user greeting + status + user avatar */}
        <div className="flex items-center gap-3">
          {userDisplayName && (
            <span className="hidden md:block text-[11px] text-zinc-500">
              Hi, <span className="text-zinc-300 font-medium">{userDisplayName}</span>
            </span>
          )}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-[10px] text-emerald-400 font-semibold">Online</span>
          </div>
          {/* User avatar — opens Settings */}
          <button
            onClick={() => setActiveView("settings")}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 transition-all"
            title="Settings"
          >
            {userDisplayName ? userDisplayName.slice(0, 2).toUpperCase() : "?"}
          </button>
        </div>
      </header>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <SidebarNav activeView={activeView} onViewChange={setActiveView} />

        <div className="flex flex-1 min-w-0 overflow-hidden">
          {activeView === "chats" && (
            <>
              <ChatList selectedChatId={activeChatId} onSelectChat={setActiveChatId} />
              {chatProps ? <ChatWindow {...chatProps} /> : <EmptyState onStartNew={() => conversations[0] && setActiveChatId(conversations[0].id)} />}
            </>
          )}
          {activeView === "contacts" && <ContactsView />}
          {activeView === "funds"    && <FundsDashboard />}
          {activeView === "settings" && <SettingsView />}
        </div>
      </div>

      {/* ── Global call modal ──────────────────────────────────────────── */}
      {call && (
        <CallModal
          contactName={call.name}
          callType={call.type}
          onEnd={() => setCall(null)}
        />
      )}
    </main>
  );
}

/* ── Empty / Welcome state ─────────────────────────────────────────────── */
function EmptyState({ onStartNew }: { onStartNew: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 text-center px-8 select-none">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-500/10 blur-2xl scale-150" />
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/15 via-orange-500/10 to-amber-500/5 border border-orange-500/20 flex items-center justify-center shadow-2xl shadow-orange-500/10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-orange-400">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome to FundChain</h2>
      <p className="text-sm text-zinc-500 max-w-[280px] leading-relaxed mb-8">
        Select a conversation to start messaging, or open the{" "}
        <span className="text-orange-400 font-semibold">Funds</span> tab to create transparent group collections.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-[280px] w-full mb-8">
        {[
          { icon: "💬", label: "Free messaging",    sub: "Zero gas · instant" },
          { icon: "💰", label: "Group fund pools",  sub: "Transparent · on-chain" },
          { icon: "🎲", label: "Lucky draw",        sub: "Verifiably random" },
          { icon: "🔗", label: "Full audit trail",  sub: "Every tx on-chain" },
        ].map((f) => (
          <div
            key={f.label}
            className="rounded-2xl bg-zinc-800/40 border border-zinc-700/30 px-4 py-3.5 text-left hover:border-zinc-600/50 transition-colors"
          >
            <p className="text-xl mb-1.5">{f.icon}</p>
            <p className="text-[13px] font-semibold text-zinc-300">{f.label}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">{f.sub}</p>
          </div>
        ))}
      </div>

      <button
        id="empty-state-start-btn"
        onClick={onStartNew}
        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all"
      >
        Start a Conversation
      </button>
    </div>
  );
}
