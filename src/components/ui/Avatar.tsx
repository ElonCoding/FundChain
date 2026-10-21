"use client";

import { cn, stringToColor, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | null;
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const statusSizeMap = {
  sm: "w-2.5 h-2.5 border",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-4 h-4 border-2",
};

const statusColorMap = {
  online: "bg-emerald-400",
  away: "bg-amber-400",
  offline: "bg-zinc-500",
};

export default function Avatar({ name, imageUrl, size = "md", status, className }: AvatarProps) {
  const bgColor = stringToColor(name);
  const initials = getInitials(name);

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className={cn(sizeMap[size], "rounded-full object-cover ring-2 ring-white/10")}
        />
      ) : (
        <div
          className={cn(
            sizeMap[size],
            "rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white/10 select-none"
          )}
          style={{ backgroundColor: bgColor }}
          suppressHydrationWarning
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={cn(
            statusSizeMap[size],
            statusColorMap[status],
            "absolute bottom-0 right-0 rounded-full border-zinc-900"
          )}
        />
      )}
    </div>
  );
}
