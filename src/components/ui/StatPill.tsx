"use client";

import { cn } from "@/lib/utils";

interface StatPillProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export default function StatPill({ label, value, highlight }: StatPillProps) {
  return (
    <div className={cn(
      "flex flex-col p-3 rounded-2xl border transition-all",
      highlight
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        : "bg-slate-900/60 border-slate-800 text-slate-300"
    )}>
      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{label}</span>
      <span className="text-lg font-extrabold text-white mt-0.5">{value}</span>
    </div>
  );
}
