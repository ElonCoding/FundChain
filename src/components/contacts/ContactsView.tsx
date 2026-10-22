"use client";

import { useState, useEffect } from "react";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { supabase, startPrivateConversation } from "@/lib/supabase";
import { useProfile } from "@/hooks/useSupabaseChat";
import type { Contact } from "@/lib/types";
import AddContactModal from "./AddContactModal";
import SendAvaxModal from "./SendAvaxModal";

interface ContactsViewProps {
  onStartChat?: (conversationId: string) => void;
}

export default function ContactsView({ onStartChat }: ContactsViewProps) {
  const { address } = useAccount();
  const { profile } = useProfile(address ?? null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSendAvaxModal, setShowSendAvaxModal] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Fetch profiles from Supabase
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const baseQuery = supabase
        .from("profiles")
        .select("id, wallet_address, display_name, avatar_url, status")
        .order("display_name", { ascending: true });

      const finalQuery = profile?.id
        ? baseQuery.neq("id", profile.id)
        : baseQuery;

      const { data, error: err } = await finalQuery;

      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else {
        const mapped = ((data ?? []) as any[]).map((r) => ({
          id: r.id,
          wallet_address: r.wallet_address,
          display_name: r.display_name,
          avatar_url: r.avatar_url,
          status: r.status as Contact["status"],
        }));
        setContacts(mapped);
        if (mapped.length > 0 && !selected) {
          setSelected(mapped[0]);
        }
      }
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profile?.id]);

  async function handleSendMessage(target: Contact) {
    if (!profile) {
      alert("Please connect your wallet first.");
      return;
    }
    setIsStartingChat(true);
    try {
      const convId = await startPrivateConversation(
        profile.id,
        target.id,
        target.display_name
      );
      if (onStartChat) {
        onStartChat(convId);
      }
    } catch (err: any) {
      console.error(err);
      alert("Could not start conversation: " + (err?.message || "Unknown error"));
    } finally {
      setIsStartingChat(false);
    }
  }

  const filtered = contacts.filter((c) =>
    c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    c.wallet_address.toLowerCase().includes(search.toLowerCase())
  );
  const online = filtered.filter((c) => c.status === "online");
  const others = filtered.filter((c) => c.status !== "online");

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* ── Contact list ────────────────────────────────────────────────── */}
      <div className={cn(
        "flex flex-col h-full bg-[#0F172A] border-r border-slate-800 flex-shrink-0 transition-all duration-300",
        selected ? "w-[320px]" : "flex-1 max-w-none"
      )}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-slate-800/80 bg-gradient-to-b from-[#0A2E22]/30 to-transparent">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-tight">People &amp; Network</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isLoading ? "Loading…" : `${contacts.length} members`}
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 hover:text-white transition-all shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Add Member
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or wallet address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-500">Loading contacts…</div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              No contacts found. Click &quot;Add Member&quot; to add someone!
            </div>
          )}

          {online.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Online — {online.length}
              </p>
              {online.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  isSelected={selected?.id === c.id}
                  onClick={() => setSelected(c)}
                />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Offline — {others.length}
              </p>
              {others.map((c) => (
                <ContactRow
                  key={c.id}
                  contact={c}
                  isSelected={selected?.id === c.id}
                  onClick={() => setSelected(c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Contact detail panel ────────────────────────────────────────── */}
      {selected ? (
        <ContactDetail
          contact={selected}
          onClose={() => setSelected(null)}
          onSendMessage={() => handleSendMessage(selected)}
          onSendAvax={() => setShowSendAvaxModal(true)}
          isStartingChat={isStartingChat}
        />
      ) : (
        <ContactDetailEmpty />
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onAdded={(newC) => {
            setContacts((prev) => [newC, ...prev]);
            setSelected(newC);
          }}
        />
      )}

      {/* Send AVAX Modal */}
      {showSendAvaxModal && selected && (
        <SendAvaxModal
          recipientAddress={selected.wallet_address}
          recipientName={selected.display_name}
          onClose={() => setShowSendAvaxModal(false)}
        />
      )}
    </div>
  );
}

function ContactRow({
  contact,
  isSelected,
  onClick,
}: {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left",
        isSelected
          ? "bg-slate-800/90 border border-emerald-500/30 text-white shadow-sm"
          : "hover:bg-slate-800/40 text-slate-300"
      )}
    >
      <div className="relative flex-shrink-0">
        <Avatar name={contact.display_name} size="md" />
        <span
          className={cn(
            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900",
            contact.status === "online" ? "bg-emerald-400" : "bg-slate-600"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{contact.display_name}</p>
        <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
          {contact.wallet_address}
        </p>
      </div>
    </button>
  );
}

function ContactDetail({
  contact,
  onClose,
  onSendMessage,
  onSendAvax,
  isStartingChat,
}: {
  contact: Contact;
  onClose: () => void;
  onSendMessage: () => void;
  onSendAvax: () => void;
  isStartingChat: boolean;
}) {
  return (
    <div className="flex flex-col flex-1 h-full bg-[#0F172A] overflow-hidden">
      {/* Top action bar */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Member Details</h2>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
        >
          ✕
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center pt-8 pb-6 px-8 border-b border-slate-800 bg-gradient-to-b from-[#0A2E22]/20 to-transparent">
        <div className="relative mb-3">
          <Avatar name={contact.display_name} size="xl" />
          <span
            className={cn(
              "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#0F172A]",
              contact.status === "online" ? "bg-emerald-400" : "bg-slate-600"
            )}
          />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">{contact.display_name}</h2>
        <span className="mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
          {contact.status === "online" ? "● Active Now" : "○ Offline"}
        </span>
      </div>

      {/* Info fields */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Wallet Address</p>
          <p className="text-xs font-mono text-emerald-400 mt-1 break-all select-all">
            {contact.wallet_address}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Network</p>
            <p className="text-xs text-white font-medium mt-0.5">Avalanche Fuji C-Chain</p>
          </div>
          <span className="text-sm">🔺</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">SnowTrace Verification</p>
            <a
              href={`https://testnet.snowtrace.io/address/${contact.wallet_address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-400 hover:underline mt-0.5 block"
            >
              View on Block Explorer →
            </a>
          </div>
          <span className="text-sm">🔗</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-6 border-t border-slate-800 flex gap-3 bg-slate-950/40">
        <button
          onClick={onSendMessage}
          disabled={isStartingChat}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
        >
          💬 {isStartingChat ? "Opening Chat…" : "Send Message"}
        </button>
        <button
          onClick={onSendAvax}
          className="flex-1 py-3 rounded-2xl bg-slate-800 border border-slate-700/60 text-white font-bold text-xs hover:bg-slate-700 hover:border-orange-500/40 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          🔺 Send AVAX
        </button>
      </div>
    </div>
  );
}

function ContactDetailEmpty() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-[#0F172A] text-center px-8 select-none">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 text-2xl">
        👥
      </div>
      <p className="text-sm font-semibold text-slate-300">Select a member</p>
      <p className="text-xs text-slate-500 mt-1">Click any member to view details or start a chat</p>
    </div>
  );
}
