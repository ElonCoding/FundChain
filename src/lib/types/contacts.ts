export interface ContactStatusConfig {
  label: string;
  dot: string;
  badge: string;
}

export const CONTACT_STATUS_MAP: Record<string, ContactStatusConfig> = {
  online: { label: "● Active", dot: "bg-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
  away: { label: "○ Away", dot: "bg-amber-400", badge: "bg-amber-500/10 border-amber-500/30 text-amber-400" },
  offline: { label: "○ Offline", dot: "bg-slate-600", badge: "bg-slate-800 border-slate-700 text-slate-400" },
};
