"use client";

import { cn } from "@/lib/utils";

export default function StatusDot({ status }: { status: "online" | "away" | "offline" }) {
  const colors = {
    online: "bg-emerald-400 shadow-[0_0_8px_#16A34A]",
    away: "bg-amber-400",
    offline: "bg-slate-600",
  };
  return <span className={cn("inline-block w-2 h-2 rounded-full", colors[status])} />;
}
