"use client";
import { cn } from "@/lib/utils";

interface SkeletonProps { width?: string; height?: string; rounded?: "sm" | "md" | "lg" | "full"; className?: string; }

const R = { sm: "rounded", md: "rounded-md", lg: "rounded-xl", full: "rounded-full" };

export default function Skeleton({ width = "100%", height = "1rem", rounded = "md", className }: SkeletonProps) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("block animate-pulse bg-zinc-800/70", R[rounded], className)}
      style={{ width, height }}
    />
  );
}

