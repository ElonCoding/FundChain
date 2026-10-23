"use client";
import { cn, stringToColor, getInitials } from "@/lib/utils";

interface AvatarProps { name: string; size?: "xs" | "sm" | "md" | "lg"; className?: string; }

const S = { xs: "w-6 h-6 text-[9px]", sm: "w-8 h-8 text-[11px]", md: "w-10 h-10 text-[13px]", lg: "w-14 h-14 text-lg" };

export default function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <span
      aria-label={name}
      className={cn("inline-flex items-center justify-center rounded-full font-bold select-none flex-shrink-0", S[size], className)}
      style={{ background: stringToColor(name), color: "#fff" }}
    >
      {getInitials(name)}
    </span>
  );
}

