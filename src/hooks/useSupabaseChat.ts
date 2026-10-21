/**
 * useSupabaseChat.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Production-grade Supabase-powered chat hooks.
 * NO mock data. NO silent fallbacks. Supabase env vars are REQUIRED.
 *
 *  Exports:
 *   - useProfile        — wallet → profile (upsert on connect)
 *   - useConversations  — sidebar list with real-time unread counts
 *   - useMessages       — message history + real-time INSERT subscription
 * ─────────────────────────────────────────────────────────────────────────
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getOrCreateProfile, upsertProfile, markOffline } from "@/lib/supabase";
import type { ConversationWithMeta, MessageWithSender, Profile } from "@/lib/database.types";
// Profile re-exported so callers don't need a separate import
export type { Profile };

/* ══════════════════════════════════════════════════════════════════════════
   useProfile
   Fetches or creates the current user's profile on wallet connect.
   Marks offline on disconnect.
══════════════════════════════════════════════════════════════════════════ */
export function useProfile(walletAddress: string | null) {
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      if (profile) markOffline(profile.wallet_address);
      setProfile(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getOrCreateProfile(walletAddress).then((p) => {
      if (!cancelled) {
        setProfile(p ?? null);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const updateDisplayName = useCallback(
    async (name: string) => {
      if (!walletAddress) return;
      const updated = await upsertProfile(walletAddress, name);
      if (updated) setProfile(updated);
    },
    [walletAddress]
  );

  return { profile, isLoading, updateDisplayName };
}

/* ══════════════════════════════════════════════════════════════════════════
   useConversations
   Fetches all conversations the profile participates in, sorted by
   last_message_at DESC.

   Unread count strategy (session-local, no DB read receipts table):
   - On initial load all conversations start at unread_count = 0.
   - Incoming realtime INSERTs from other senders in non-active conversations
     increment a local bump counter immediately.
   - markConversationRead(convId) resets the counter and clears the badge
     when the user opens that chat.
══════════════════════════════════════════════════════════════════════════ */
export function useConversations(
  profileId:     string | null,
  activeChatId?: string | null   // currently open chat, so we skip its INSERTs
) {
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  // Session-local unread bump per conversation
  const unreadBumpRef   = useRef<Map<string, number>>(new Map());
  // Keep activeChatId fresh inside realtime callbacks without re-subscribing
  const activeChatIdRef = useRef<string | null | undefined>(activeChatId);
  // Realtime channel refs
  const convChannelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const msgChannelRef   = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Sync ref on every render so callbacks always see the latest activeChatId
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  });

  /* ── Fetch conversations list ─────────────────────────────────────────── */
  const fetchConversations = useCallback(async () => {
    if (!profileId) { setIsLoading(false); return; }

    setIsLoading(true);
    setError(null);

    try {
      const { data: participations, error: pErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", profileId);

      if (pErr) throw pErr;

      if (!participations?.length) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const convIds = (participations as { conversation_id: string }[]).map((p) => p.conversation_id);

      const { data: rows, error: cErr } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(
            profile:profiles!conversation_participants_profile_id_fkey(
              id, display_name, avatar_url, status
            )
          )
        `)
        .in("id", convIds)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (cErr) throw cErr;

      const enriched: ConversationWithMeta[] = ((rows ?? []) as Record<string, unknown>[]).map((row) => ({
        ...(row as ConversationWithMeta),
        // Preserve any session-local unread bump from before the re-fetch
        unread_count: unreadBumpRef.current.get(row["id"] as string) ?? 0,
        participants: ((row["participants"] as { profile: ConversationWithMeta["participants"][number] }[]) ?? [])
          .map((p) => p.profile)
          .filter(Boolean),
      }));

      setConversations(enriched);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load conversations";
      setError(msg);
      console.error("[useConversations] fetchConversations:", msg);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /* ── Realtime: conversation UPDATE → refresh last_message preview ─────── */
  useEffect(() => {
    if (!profileId) return;

    if (convChannelRef.current) {
      supabase.removeChannel(convChannelRef.current);
    }

    convChannelRef.current = supabase
      .channel(`conv-updates:${profileId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          setConversations((prev) => {
            const updated = prev.map((c) =>
              c.id === payload.new.id
                ? {
                    ...c,
                    last_message:    payload.new.last_message    as string | null,
                    last_message_at: payload.new.last_message_at as string | null,
                    updated_at:      payload.new.updated_at      as string,
                  }
                : c
            );
            return [...updated].sort((a, b) =>
              (b.last_message_at ?? b.created_at) > (a.last_message_at ?? a.created_at) ? 1 : -1
            );
          });
        }
      )
      .subscribe();

    return () => {
      if (convChannelRef.current) {
        supabase.removeChannel(convChannelRef.current);
        convChannelRef.current = null;
      }
    };
  }, [profileId]);

  /* ── Realtime: message INSERT → bump unread count for inactive chats ──── */
  useEffect(() => {
    if (!profileId) return;

    if (msgChannelRef.current) {
      supabase.removeChannel(msgChannelRef.current);
    }

    msgChannelRef.current = supabase
      .channel(`unread-tracker:${profileId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const convId   = payload.new.conversation_id as string;
          const senderId = payload.new.sender_id       as string;

          // Skip own messages and messages in the currently open chat
          if (senderId === profileId) return;
          if (convId === activeChatIdRef.current) return;

          // Bump the session counter
          const current = unreadBumpRef.current.get(convId) ?? 0;
          unreadBumpRef.current.set(convId, current + 1);

          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, unread_count: (c.unread_count ?? 0) + 1 }
                : c
            )
          );
        }
      )
      .subscribe();

    return () => {
      if (msgChannelRef.current) {
        supabase.removeChannel(msgChannelRef.current);
        msgChannelRef.current = null;
      }
    };
  // Only re-subscribe when profileId changes — activeChatId is read via ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  /* ── markConversationRead — reset badge when user opens a chat ─────────── */
  const markConversationRead = useCallback((convId: string) => {
    unreadBumpRef.current.set(convId, 0);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
    );
  }, []);

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
    markConversationRead,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   useMessages
   Fetches message history for a conversation and subscribes to new messages
   via Supabase Realtime.

   Guarantees:
   ✔ Clears stale messages immediately on conversationId change
   ✔ Fetches fresh history from Supabase on every conversation switch
   ✔ Optimistic UI: message appears instantly, replaced by server row on ACK
   ✔ Rollback on INSERT failure
   ✔ Deduplicates incoming realtime events
══════════════════════════════════════════════════════════════════════════ */

const MESSAGE_PAGE_SIZE = 80;

export function useMessages(conversationId: string | null) {
  const [messages,  setMessages]  = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /* ── Fetch message history ────────────────────────────────────────────── */
  const fetchMessages = useCallback(async (convId: string) => {
    setIsLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          id, display_name, avatar_url, wallet_address
        )
      `)
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(MESSAGE_PAGE_SIZE);

    if (err) {
      setError(err.message);
      console.error("[useMessages] fetchMessages:", err.message);
    } else {
      setMessages((data ?? []) as MessageWithSender[]);
    }
    setIsLoading(false);
  }, []);

  /* ── Wire up on conversationId change ─────────────────────────────────── */
  useEffect(() => {
    // Clear stale messages from previous conversation immediately
    setMessages([]);
    setError(null);

    if (!conversationId) return;

    // Always fetch fresh history — no StrictMode guard so switching back
    // to any previously visited chat always re-queries Supabase.
    fetchMessages(conversationId);

    // Tear down previous channel before opening a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Open realtime channel for this conversation
    channelRef.current = supabase
      .channel(`messages:conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Enrich the incoming message with sender profile data
          const { data: senderRow } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url, wallet_address")
            .eq("id", payload.new.sender_id)
            .single();

          const enriched: MessageWithSender = {
            ...(payload.new as MessageWithSender),
            sender: senderRow ?? {
              id:             payload.new.sender_id as string,
              display_name:   "Unknown",
              avatar_url:     null,
              wallet_address: "",
            },
          };

          setMessages((prev) => {
            // Deduplication: skip if real row already rendered
            if (prev.some((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.error("[useMessages] realtime channel error for conv:", conversationId);
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, fetchMessages]);

  /* ── Send message with optimistic UI ─────────────────────────────────── */
  const send = useCallback(
    async (
      senderId:      string,
      senderProfile: Pick<Profile, "id" | "display_name" | "avatar_url" | "wallet_address">,
      content:       string,
      opts?: {
        type?:        "text" | "system" | "tx";
        tx_hash?:     string;
        tx_chain_id?: number;
        reply_to?:    string;
      }
    ): Promise<boolean> => {
      if (!conversationId || !content.trim()) return false;

      setIsSending(true);

      // Optimistic insert — use real sender profile so name/avatar are correct
      const tempId = `opt-${Date.now()}`;
      const optimistic: MessageWithSender = {
        id:              tempId,
        conversation_id: conversationId,
        sender_id:       senderId,
        content:         content.trim(),
        message_type:    opts?.type      ?? "text",
        file_url:        null,
        file_name:       null,
        file_size:       null,
        tx_hash:         opts?.tx_hash    ?? null,
        tx_chain_id:     opts?.tx_chain_id ?? null,
        reply_to:        opts?.reply_to   ?? null,
        metadata:        null,
        created_at:      new Date().toISOString(),
        sender:          senderProfile,
      };
      setMessages((prev) => [...prev, optimistic]);

      // Persist to Supabase
      const { data, error: err } = await (supabase
        .from("messages") as ReturnType<typeof supabase.from>)
        .insert({
          conversation_id: conversationId,
          sender_id:       senderId,
          content:         content.trim(),
          message_type:    opts?.type ?? "text",
          tx_hash:         opts?.tx_hash,
          tx_chain_id:     opts?.tx_chain_id,
          reply_to:        opts?.reply_to,
        } as Record<string, unknown>)
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(
            id, display_name, avatar_url, wallet_address
          )
        `)
        .single();

      if (err) {
        // Rollback optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        console.error("[useMessages] send failed:", err.message);
        setIsSending(false);
        return false;
      }

      // Replace optimistic stub with confirmed server row
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? (data as MessageWithSender) : m))
      );

      setIsSending(false);
      return true;
    },
    [conversationId]
  );

  return {
    messages,
    isLoading,
    isSending,
    error,
    send,
    refetch: () => conversationId && fetchMessages(conversationId),
  };
}
