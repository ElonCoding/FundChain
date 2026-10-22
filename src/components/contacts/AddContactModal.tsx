"use client";

import { useState } from "react";
import { upsertProfile } from "@/lib/supabase";

interface AddContactModalProps {
  onClose: () => void;
  onAdded: (newContact: any) => void;
}

export default function AddContactModal({ onClose, onAdded }: AddContactModalProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const profile = await upsertProfile(address.trim(), name.trim());
      if (!profile) throw new Error("Could not save profile to Supabase");
      onAdded({
        id: profile.id,
        wallet_address: profile.wallet_address,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        status: profile.status,
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to add member");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#0A2E22]/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Add Member / Contact</h2>
              <p className="text-[11px] text-slate-400">Save a wallet address to your network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Chen"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Wallet Address (Avalanche)
            </label>
            <input
              type="text"
              placeholder="0x…"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50 text-xs text-slate-300 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 text-slate-950 font-bold text-xs hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Saving…" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
