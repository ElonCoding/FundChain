"use client";

import { cn } from "@/lib/utils";

interface ProgressGaugeProps {
  progress: number;
  className?: string;
}

export default function ProgressGauge({ progress, className }: ProgressGaugeProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  return (
    <div className={cn("w-full bg-slate-800 rounded-full h-2 overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#16A34A] via-[#6EE7B7] to-teal-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
