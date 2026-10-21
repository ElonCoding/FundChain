"use client";

import { useState, useEffect } from "react";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useSupabaseChat";
import type { Contact } from "@/lib/types";

export default function ContactsView() {
  const { address }       = useAccount();
  const { profile }       = useProfile(address ?? null);
  const [contacts,   setContacts]   = useState<Contact[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [selected,   setSelected]   = useState<Contact | null>(null);

  // Fetch all other profiles from Supabase
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      // Build query — exclude current user if signed in
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
        setContacts(
          ((data ?? []) as { id: string; wallet_address: string; display_name: string; avatar_url: string | null; status: string }[]).map((r) => ({
            id:             r.id,
            wallet_address: r.wallet_address,
            display_name:   r.display_name,
            avatar_url:     r.avatar_url,
            status:         r.status as Contact["status"],
          }))
        );
      }
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [profile?.id]);

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
        "flex flex-col h-full bg-zinc-900/95 border-r border-zinc-800/60 flex-shrink-0 transition-all duration-300",
        selected ? "w-[320px]" : "flex-1 max-w-none"
      )}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-zinc-800/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-[15px] font-bold text-white tracking-tight">People</h1>
              <p className="text-[11px] text-zinc-500 mt-0.5">{isLoading ? "Loading…" : `${contacts.length} contacts`}</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/70 border border-zinc-700/40 text-xs text-zinc-400 hover:text-white hover:border-zinc-600 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              Add
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-800/60 border border-zinc-700/40 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-zinc-800">
          {/* Error state */}
          {error && (
            <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20">
              <p className="text-[11px] text-red-400 font-medium">Failed to load contacts</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{error}</p>
            </div>
          )}
          {/* Loading skeletons */}
          {isLoading && (
            <div className="px-4 space-y-1 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                  <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 skeleton rounded-full w-2/3" />
                    <div className="h-2 skeleton rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && online.length > 0 && (
            <div className="px-4 mb-3">
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mb-1.5 px-1">
                Online · {online.length}
              </p>
              <div className="space-y-0.5">
                {online.map((c) => (
                  <ContactRow key={c.id} contact={c} isSelected={selected?.id === c.id} onClick={() => setSelected(c)} />
                ))}
              </div>
            </div>
          )}
          {!isLoading && others.length > 0 && (
            <div className="px-4">
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold mb-1.5 px-1">
                Other · {others.length}
              </p>
              <div className="space-y-0.5">
                {others.map((c) => (
                  <ContactRow key={c.id} contact={c} isSelected={selected?.id === c.id} onClick={() => setSelected(c)} />
                ))}
              </div>
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
              <p className="text-sm">{search ? "No contacts match" : "No contacts yet"}</p>
              <p className="text-xs text-zinc-600 mt-1">
                {search ? "Try a different search term" : "Other users appear here once they connect"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Contact detail pane ──────────────────────────────────────────── */}
      {selected ? (
        <ContactDetail contact={selected} onClose={() => setSelected(null)} />
      ) : (
        <ContactDetailEmpty />
      )}
    </div>
  );
}

/* ── Contact row item ───────────────────────────────────────────────────── */
function ContactRow({ contact, isSelected, onClick }: { contact: Contact; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group cursor-pointer",
        isSelected
          ? "bg-zinc-800 border border-zinc-700/50"
          : "hover:bg-zinc-800/40 border border-transparent"
      )}
    >
      <Avatar name={contact.display_name} size="sm" status={contact.status} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate transition-colors", isSelected ? "text-white" : "text-zinc-300 group-hover:text-white")}>
          {contact.display_name}
        </p>
        <p className="text-[10px] text-zinc-600 font-mono truncate">{contact.wallet_address}</p>
      </div>
      {/* Hover action icons */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => e.stopPropagation()}
          title="Message"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          title="Send AVAX"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>
          </svg>
        </button>
      </div>
      {isSelected && (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
      )}
    </div>
  );
}

/* ── Contact detail panel ───────────────────────────────────────────────── */
function ContactDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const statusColors = {
    online:  { dot: "bg-emerald-400", label: "Online",      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    away:    { dot: "bg-amber-400",   label: "Away",        badge: "bg-amber-500/10 text-amber-400 border-amber-500/20"       },
    offline: { dot: "bg-zinc-600",    label: "Last seen recently", badge: "bg-zinc-700/40 text-zinc-400 border-zinc-600/30"  },
  };
  const s = statusColors[contact.status];

  return (
    <div className="flex flex-col flex-1 bg-zinc-900 animate-in fade-in duration-200 overflow-hidden">
      {/* Top action bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-zinc-800/60">
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-white">Contact Info</p>
        <div className="ml-auto flex gap-1.5">
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Voice call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg>
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
        </div>
      </div>

      {/* Profile hero */}
      <div className="flex flex-col items-center pt-10 pb-8 px-8 border-b border-zinc-800/50">
        <div className="relative mb-4">
          <Avatar name={contact.display_name} size="xl" />
          <span className={cn("absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-zinc-900", s.dot)} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">{contact.display_name}</h2>
        <span className={cn("mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border", s.badge)}>
          {s.label}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        <InfoRow icon="💳" label="Wallet" value={contact.wallet_address} mono />
        <InfoRow icon="🔗" label="Explorer" value="View on SnowTrace →" link={`https://snowtrace.io/address/${contact.wallet_address}`} />
        <InfoRow icon="🌐" label="Network" value="Avalanche C-Chain" />
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 flex gap-2">
        <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all">
          Send Message
        </button>
        <button className="flex-1 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700/40 text-zinc-300 text-sm font-medium hover:text-white hover:border-zinc-600 transition-all">
          Send AVAX
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono, link }: { icon: string; label: string; value: string; mono?: boolean; link?: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30">
      <span className="text-base mt-px">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">{label}</p>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className={cn("text-xs text-orange-400 hover:text-orange-300 transition-colors mt-0.5 block", mono && "font-mono break-all")}>
            {value}
          </a>
        ) : (
          <p className={cn("text-xs text-zinc-200 mt-0.5 break-all", mono && "font-mono")}>{value}</p>
        )}
      </div>
    </div>
  );
}

function ContactDetailEmpty() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-900 text-center px-8 select-none">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-zinc-600">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <p className="text-sm font-semibold text-zinc-400">Select a contact</p>
      <p className="text-xs text-zinc-600 mt-1">Click anyone to view their profile</p>
    </div>
  );
}
