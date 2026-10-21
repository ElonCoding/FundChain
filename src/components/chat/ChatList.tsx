/**
 * ChatList.tsx
 * ─────────────────────────────────────────────────────────────────────────
 * Sidebar conversation list — 100% Supabase-driven.
 * No mock data. No fallback. Requires NEXT_PUBLIC_SUPABASE_URL +
 * NEXT_PUBLIC_SUPABASE_ANON_KEY to be set.
 * ─────────────────────────────────────────────────────────────────────────
 */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useAccount } from "wagmi";
import { cn, formatRelativeTime } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { useConversations, useProfile } from "@/hooks/useSupabaseChat";
import { SUPABASE_ENABLED } from "@/lib/supabase";
import type { ConversationWithMeta } from "@/lib/database.types";

interface ChatListProps {
  selectedChatId: string | null;
  onSelectChat:   (chatId: string) => void;
}

/* ──────────────────────────────────────────────────────────
 *  Supabase env-missing error screen
 * ────────────────────────────────────────────────────────── */
function SupabaseMissingError() {
  return (
    <div className="flex flex-col h-full bg-zinc-900/95 border-r border-zinc-800/60 w-[320px] flex-shrink-0 items-center justify-center px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p className="text-sm font-bold text-red-400 mb-1">Supabase Not Configured</p>
      <p className="text-xs text-zinc-500 leading-relaxed mb-4">
        Add your credentials to <span className="font-mono text-zinc-400">.env.local</span> to enable real-time chat.
      </p>
      <div className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-3 text-left space-y-1">
        <p className="text-[10px] font-mono text-orange-400">NEXT_PUBLIC_SUPABASE_URL=</p>
        <p className="text-[10px] font-mono text-orange-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=</p>
      </div>
      <p className="text-[10px] text-zinc-600 mt-3">Restart the dev server after adding the keys.</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Loading skeleton
 * ────────────────────────────────────────────────────────── */
function ChatSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 skeleton rounded-full w-3/4" />
        <div className="h-2.5 skeleton rounded-full w-1/2" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Conversation row
 * ────────────────────────────────────────────────────────── */
function ConversationRow({
  conv,
  isSelected,
  onClick,
  currentProfileId,
}: {
  conv:             ConversationWithMeta;
  isSelected:       boolean;
  onClick:          () => void;
  currentProfileId: string | null;
}) {
  // For private chats, show the other party's name instead of the conversation name
  const displayName = useMemo(() => {
    if (conv.type !== "private") return conv.name;
    const other = conv.participants.find((p) => p.id !== currentProfileId);
    return other?.display_name ?? conv.name;
  }, [conv, currentProfileId]);

  // Derived avatar display
  const avatarInitial = conv.type === "fund-group"
    ? (conv.pool_type === "luckydraw" ? "🎲" : "🎯")
    : displayName;

  // Online status (only meaningful for private chats)
  const otherParticipantStatus = conv.type === "private"
    ? (conv.participants.find((p) => p.id !== currentProfileId)?.status ?? null)
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 transition-all duration-150 group relative",
        isSelected
          ? "bg-zinc-800/80"
          : "hover:bg-zinc-800/40"
      )}
    >
      {/* Selection indicator bar */}
      {isSelected && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-red-500 to-orange-500" />
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar
          name={avatarInitial}
          size="md"
          status={otherParticipantStatus}
        />
        {conv.type === "fund-group" && (
          <span className="absolute -bottom-0.5 -right-0.5 text-[9px] leading-none">
            {conv.pool_type === "luckydraw" ? "🎲" : "🎯"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn(
            "text-[13.5px] font-semibold truncate",
            isSelected ? "text-white" : "text-zinc-200 group-hover:text-white"
          )}>
            {displayName}
          </span>
          {conv.last_message_at && (
            <span className="text-[10px] text-zinc-500 flex-shrink-0" suppressHydrationWarning>
              {formatRelativeTime(conv.last_message_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[12px] text-zinc-500 truncate flex-1">
            {conv.last_message ?? (conv.type === "fund-group" ? "Fund group created" : "No messages yet")}
          </p>
          {conv.unread_count > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-75 duration-200">
              {conv.unread_count > 9 ? "9+" : conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Main ChatList
 * ────────────────────────────────────────────────────────── */
export default function ChatList({ selectedChatId, onSelectChat }: ChatListProps) {
  const { address } = useAccount();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "groups" | "funds">("all");

  const { profile } = useProfile(address ?? null);

  const {
    conversations,
    isLoading,
    error,
    markConversationRead,
  } = useConversations(profile?.id ?? null, selectedChatId);

  // Mark conversation as read whenever the user selects it
  useEffect(() => {
    if (selectedChatId && profile?.id) {
      markConversationRead(selectedChatId);
    }
  }, [selectedChatId, profile?.id, markConversationRead]);

  // Guard: if Supabase isn't configured, show a clear error instead of blank
  if (!SUPABASE_ENABLED) {
    return <SupabaseMissingError />;
  }

  // Filtered list based on search + filter chip
  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      const displayName = c.type !== "private"
        ? c.name
        : (c.participants.find((p) => p.id !== profile?.id)?.display_name ?? c.name);

      const matchSearch = displayName.toLowerCase().includes(search.toLowerCase()) ||
        (c.last_message ?? "").toLowerCase().includes(search.toLowerCase());

      const matchFilter = filter === "all"    ? true
        : filter === "groups" ? c.type !== "private"
        : c.type === "fund-group";

      return matchSearch && matchFilter;
    });
  }, [conversations, search, filter, profile?.id]);

  return (
    <div className="flex flex-col h-full bg-zinc-900/95 border-r border-zinc-800/60 w-[320px] flex-shrink-0">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[15px] font-bold text-white">Chats</h1>
          <div className="flex items-center gap-1.5">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="New chat"
              title="New direct message"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M12 7v6M9 10h6"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            id="chat-search"
            type="text"
            placeholder="Search chats…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 transition-all"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5">
          {(["all", "groups", "funds"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize",
                filter === f
                  ? "bg-zinc-800 text-white border border-zinc-700/50"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {f === "funds" ? "💰 Funds" : f === "groups" ? "👥 Groups" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* ── List body ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

        {/* Error state (only shown in dev to avoid scaring users in prod) */}
        {error && process.env.NODE_ENV === "development" && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20">
            <p className="text-[11px] text-red-400 font-medium">Realtime error</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">{error}</p>
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <>
            <ChatSkeleton />
            <ChatSkeleton />
            <ChatSkeleton />
            <ChatSkeleton />
          </>
        )}

        {/* Conversation rows */}
        {!isLoading && filtered.map((conv) => (
          <ConversationRow
            key={conv.id}
            conv={conv}
            isSelected={selectedChatId === conv.id}
            onClick={() => {
              markConversationRead(conv.id);
              onSelectChat(conv.id);
            }}
            currentProfileId={profile?.id ?? null}
          />
        ))}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800/60 flex items-center justify-center mb-3 text-xl">
              {search ? "🔍" : "💬"}
            </div>
            <p className="text-sm font-semibold text-zinc-400">
              {search ? "No chats match your search" : "No conversations yet"}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {search
                ? "Try a different search term"
                : !profile
                ? "Connect your wallet to see your chats"
                : "Start a conversation or join a fund group"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
