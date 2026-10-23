"use client";
import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "muted";

const V: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  warning: "bg-amber-500/10  border-amber-500/30  text-amber-400",
  danger:  "bg-red-500/10    border-red-500/30    text-red-400",
  info:    "bg-blue-500/10   border-blue-500/30   text-blue-400",
  muted:   "bg-zinc-800/60   border-zinc-700/40   text-zinc-400",
};

interface BadgeProps { label: string; variant?: BadgeVariant; className?: string; }

/** Small semantic badge/pill for pool status, chain labels, etc. */
export default function Badge({ label, variant = "muted", className }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", V[variant], className)}>
      {label}
    </span>
  );
}

