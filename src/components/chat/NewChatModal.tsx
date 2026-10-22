"use client";

import { useState, useEffect } from "react";
import { supabase, startPrivateConversation, upsertProfile } from "@/lib/supabase";
import { shortenAddress } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface NewChatModalProps {
  currentProfileId: string;
  onClose: () => void;
  onSelectChat: (conversationId: string) => void;
}

export default function NewChatModal({
  currentProfileId,
  onClose,
  onSelectChat,
}: NewChatModalProps) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [customAddress, setCustomAddress] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, wallet_address, display_name, avatar_url, status")
        .neq("id", currentProfileId)
        .order("display_name", { ascending: true })
        .limit(20);

      if (!cancelled) {
        setProfiles(data ?? []);
        setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentProfileId]);

  async function handleStartWithProfile(target: any) {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const convId = await startPrivateConversation(
        currentProfileId,
        target.id,
        target.display_name
      );
      onSelectChat(convId);
      onClose();
    } catch (err) {
      console.error("Failed to start chat:", err);
      alert("Failed to start chat. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleStartWithCustomAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!customAddress.trim() || isStarting) return;
    setIsStarting(true);
    try {
      const targetProfile = await upsertProfile(customAddress.trim());
      if (!targetProfile) throw new Error("Could not create profile");
      const convId = await startPrivateConversation(
        currentProfileId,
        targetProfile.id,
        targetProfile.display_name
      );
      onSelectChat(convId);
      onClose();
    } catch (err) {
      console.error("Failed to start chat with address:", err);
      alert("Failed to create conversation for that wallet.");
    } finally {
      setIsStarting(false);
    }
  }

  const filtered = profiles.filter((p) =>
    p.display_name.toLowerCase().includes(search.toLowerCase()) ||
    p.wallet_address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#0A2E22]/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">New Direct Message</h2>
              <p className="text-[11px] text-slate-400">Pick a registered member or enter a wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {/* Custom Wallet Direct Start */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40">
          <form onSubmit={handleStartWithCustomAddress} className="flex gap-2">
            <input
              type="text"
              placeholder="0x… or phone to start chat"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!customAddress.trim() || isStarting}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1"
            >
              Chat →
            </button>
          </form>
        </div>

        {/* Search Existing */}
        <div className="px-4 pt-3 pb-2">
          <input
            type="text"
            placeholder="Search registered members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/40 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          />
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scrollbar-thin">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading members…</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No registered members found. Enter a wallet address above to start!
            </div>
          ) : (
            filtered.map((target) => (
              <button
                key={target.id}
                onClick={() => handleStartWithProfile(target)}
                disabled={isStarting}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700/50 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={target.display_name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                      {target.display_name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {shortenAddress(target.wallet_address, 4)}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Message →
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
