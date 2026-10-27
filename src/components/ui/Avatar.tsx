"use client";
import { cn, stringToColor, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: string | null;
}

const S = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-[13px]",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const DOT_SIZE = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3.5 h-3.5",
  xl: "w-4 h-4",
};

const STATUS_COLOR: Record<string, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  offline: "bg-zinc-500",
};

export default function Avatar({ name, size = "md", className, status }: AvatarProps) {
  const avatar = (
    <span
      aria-label={name}
      className={cn("inline-flex items-center justify-center rounded-full font-bold select-none flex-shrink-0", S[size], className)}
      style={{ background: stringToColor(name), color: "#fff" }}
    >
      {getInitials(name)}
    </span>
  );

  if (!status) return avatar;

  const dotCls = STATUS_COLOR[status] ?? "bg-emerald-500";

  return (
    <div className="relative inline-flex flex-shrink-0">
      {avatar}
      <span
        className={cn(
          "absolute bottom-0 right-0 rounded-full ring-2 ring-zinc-900",
          DOT_SIZE[size],
          dotCls
        )}
      />
    </div>
  );
}

