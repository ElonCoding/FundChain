"use client";
import { cn } from "@/lib/utils";

interface DividerProps { label?: string; className?: string; vertical?: boolean; }

export default function Divider({ label, className, vertical = false }: DividerProps) {
  if (vertical) return <div className={cn("w-px bg-zinc-800/60 self-stretch", className)} />;
  if (label) return (
    <div className={cn("flex items-center gap-3 my-2", className)}>
      <div className="flex-1 h-px bg-zinc-800/60" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="flex-1 h-px bg-zinc-800/60" />
    </div>
  );
  return <div className={cn("h-px bg-zinc-800/60 my-2", className)} />;
}

