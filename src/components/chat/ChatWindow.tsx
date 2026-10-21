/**
 * ChatWindow.tsx
 * ─────────────────────────────────────────────────────────────────────────
 * Message view — 100% Supabase-driven.
 * No mock data. No fallback mode. Every message is fetched from and
 * persisted to the Supabase `messages` table. Real-time delivery via
 * Supabase Realtime postgres_changes subscription.
 * ─────────────────────────────────────────────────────────────────────────
 */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { useMessages, useProfile } from "@/hooks/useSupabaseChat";
import { SUPABASE_ENABLED } from "@/lib/supabase";
import { useToast } from "@/contexts/ToastContext";
import type { MessageWithSender } from "@/lib/database.types";

interface ChatWindowProps {
  /** Supabase conversation UUID */
  chatId:       string;
  chatName:     string;
  chatType:     "private" | "group" | "fund-group";
  poolId?:      number;
  poolType?:    "event" | "luckydraw" | null;
  onVoiceCall?: (name: string) => void;
  onVideoCall?: (name: string) => void;
}

/* ──────────────────────────────────────────────────────────
 *  Helpers
 * ────────────────────────────────────────────────────────── */
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-IN", {
      hour:   "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch { return ""; }
}

/* ──────────────────────────────────────────────────────────
 *  Supabase env-missing error screen (full window)
 * ────────────────────────────────────────────────────────── */
function SupabaseMissingError() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-900 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p className="text-base font-bold text-red-400 mb-2">Supabase Not Configured</p>
      <p className="text-sm text-zinc-500 max-w-[320px] leading-relaxed mb-5">
        Real-time messaging requires Supabase credentials. Add them to{" "}
        <span className="font-mono text-zinc-400">.env.local</span> and restart the dev server.
      </p>
      <div className="w-full max-w-[320px] bg-zinc-800/60 border border-zinc-700/40 rounded-xl p-4 text-left space-y-1.5">
        <p className="text-[11px] font-mono text-orange-400">NEXT_PUBLIC_SUPABASE_URL=https://…</p>
        <p className="text-[11px] font-mono text-orange-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Message bubble
 * ────────────────────────────────────────────────────────── */
function MessageBubble({
  msg,
  isSelf,
  showSenderName,
}: {
  msg:            MessageWithSender;
  isSelf:         boolean;
  showSenderName: boolean;
}) {
  const isSystem = msg.message_type === "system";
  const isTx     = msg.message_type === "tx";

  if (isSystem) {
    return (
      <div className="flex items-center justify-center py-1.5">
        <div className="px-4 py-1.5 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-[11px] text-zinc-400 text-center max-w-xs">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex gap-2 max-w-[76%] animate-in fade-in slide-in-from-bottom-1 duration-200",
      isSelf ? "ml-auto flex-row-reverse" : ""
    )}>
      {!isSelf && (
        <Avatar
          name={msg.sender.display_name}
          size="sm"
          className="mt-auto mb-1 flex-shrink-0"
        />
      )}

      <div>
        {showSenderName && !isSelf && (
          <p className="text-[11px] text-zinc-500 mb-0.5 px-1 font-medium">
            {msg.sender.display_name}
          </p>
        )}

        <div className={cn(
          "px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed",
          isSelf
            ? "bg-gradient-to-br from-red-500/90 to-orange-500/90 text-white rounded-br-md"
            : "bg-zinc-800 text-zinc-200 rounded-bl-md border border-zinc-700/40"
        )}>
          {isTx && msg.tx_hash ? (
            <div className="space-y-1">
              <p>{msg.content}</p>
              <a
                href={`https://snowtrace.io/tx/${msg.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-mono underline",
                  isSelf ? "text-white/70" : "text-orange-400"
                )}
              >
                {msg.tx_hash.slice(0, 14)}… ↗ SnowTrace
              </a>
            </div>
          ) : (
            <p>{msg.content}</p>
          )}

          <p className={cn(
            "text-[10px] mt-1 text-right select-none",
            isSelf ? "text-white/50" : "text-zinc-600"
          )} suppressHydrationWarning>
            {formatTime(msg.created_at)}
            {isSelf && <span className="ml-1">✓✓</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Main ChatWindow
 * ────────────────────────────────────────────────────────── */
export default function ChatWindow({
  chatId,
  chatName,
  chatType,
  poolType,
  onVoiceCall,
  onVideoCall,
}: ChatWindowProps) {
  const { address }                               = useAccount();
  const [input, setInput]                         = useState("");
  const { profile }                               = useProfile(address ?? null);
  const { messages, isLoading, isSending, send }  = useMessages(chatId);
  const { error: toastError }                     = useToast();
  const messagesEndRef                            = useRef<HTMLDivElement>(null);
  const inputRef                                  = useRef<HTMLInputElement>(null);

  // Supabase must be configured to render the chat window
  if (!SUPABASE_ENABLED) {
    return <SupabaseMissingError />;
  }

  // Auto-scroll to the latest message
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus the input whenever the chat switches
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    inputRef.current?.focus();
  }, [chatId]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    if (!profile) {
      toastError("Not signed in", "Connect your wallet to send messages");
      return;
    }

    const text = input.trim();
    setInput("");

    const ok = await send(profile.id, profile, text);
    if (!ok) {
      toastError("Message failed", "Could not send. Please try again.");
      setInput(text); // restore on failure
    }
  }, [input, profile, send, toastError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Header badge ──────────────────────────────────────────────────── */
  const headerBadge = chatType === "fund-group"
    ? poolType === "luckydraw"
      ? { label: "🎲 Lucky Draw", cls: "bg-violet-500/15 text-violet-400 border-violet-500/30" }
      : { label: "🎯 Event Pool", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" }
    : chatType === "group"
    ? { label: "👥 Group",        cls: "bg-zinc-700/60 text-zinc-400 border-zinc-600/30" }
    : null;

  return (
    <div className="flex flex-col h-full flex-1 bg-zinc-900 overflow-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800/60 bg-zinc-900/95 backdrop-blur-xl flex-shrink-0">
        <Avatar name={chatName} size="md" status={chatType === "private" ? "online" : null} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-white truncate">{chatName}</h2>
            {headerBadge && (
              <span className={cn("px-1.5 py-0.5 rounded-md text-[9px] font-bold border flex-shrink-0", headerBadge.cls)}>
                {headerBadge.label}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">
            {isLoading
              ? "Loading messages…"
              : chatType === "private"
              ? "Online"
              : chatType === "fund-group"
              ? "Fund-gated group"
              : "Group chat"}
          </p>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onVoiceCall?.(chatName)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Voice call"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/>
            </svg>
          </button>
          <button
            onClick={() => onVideoCall?.(chatName)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Video call"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Info">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">

        {/* Loading skeletons */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn("flex gap-2.5 max-w-[62%]", i % 2 === 0 ? "" : "ml-auto flex-row-reverse")}>
                {i % 2 === 0 && <div className="w-8 h-8 rounded-full skeleton flex-shrink-0 mt-1" />}
                <div className="flex-1 space-y-1.5">
                  <div className={cn("h-9 skeleton rounded-2xl", i % 2 === 0 ? "rounded-bl-sm" : "rounded-br-sm")} />
                  <div className={cn("h-2 skeleton rounded-full w-16", i % 2 === 0 ? "" : "ml-auto")} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message bubbles — database-backed */}
        {!isLoading && messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isSelf={msg.sender_id === profile?.id}
            showSenderName={chatType !== "private"}
          />
        ))}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 text-2xl">
              {chatType === "fund-group" ? "💰" : "💬"}
            </div>
            <p className="text-sm font-semibold text-zinc-400">No messages yet</p>
            <p className="text-xs text-zinc-600 mt-1">
              {chatType === "fund-group"
                ? "Contribute to the pool to start chatting!"
                : "Send the first message"}
            </p>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-zinc-800/60 bg-zinc-900/95 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Emoji button */}
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors flex-shrink-0"
            aria-label="Emoji"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>

          {/* Attachment button */}
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors flex-shrink-0"
            aria-label="Attach file"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              id="chat-message-input"
              type="text"
              placeholder={profile ? "Type a message…" : "Connect wallet to chat"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!profile || isSending}
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Send button */}
          <button
            id="chat-send-button"
            onClick={handleSend}
            disabled={!input.trim() || isSending || !profile}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
              input.trim() && !isSending && profile
                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
            aria-label="Send message"
          >
            {isSending ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Realtime connection indicator */}
        <div className="flex items-center gap-1.5 mt-1.5 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          <span className="text-[9px] text-zinc-600">Live</span>
        </div>
      </div>
    </div>
  );
}
