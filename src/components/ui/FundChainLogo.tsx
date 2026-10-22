"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

export default function FundChainLogo({
  size = "md",
  showWordmark = true,
  className,
}: LogoProps) {
  const sizeMap = {
    sm: { img: "w-6 h-6", text: "text-sm", sub: "text-[9px]" },
    md: { img: "w-8 h-8", text: "text-base", sub: "text-[10px]" },
    lg: { img: "w-12 h-12", text: "text-xl", sub: "text-xs" },
    xl: { img: "w-16 h-16", text: "text-2xl", sub: "text-sm" },
  };

  const current = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div className={cn("relative flex items-center justify-center flex-shrink-0 drop-shadow-[0_4px_12px_rgba(22,163,74,0.35)]", current.img)}>
        <img
          src="/logo.svg"
          alt="FundChain"
          className="w-full h-full object-contain"
        />
      </div>

      {showWordmark && (
        <div className="leading-tight">
          <div className="flex items-baseline">
            <span className={cn("font-extrabold text-white tracking-tight", current.text)}>
              Fund
            </span>
            <span className={cn("font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tight", current.text)}>
              Chain
            </span>
          </div>
          <p className={cn("text-zinc-400 font-medium tracking-widest uppercase opacity-75", current.sub)}>
            People · Purpose · Progress
          </p>
        </div>
      )}
    </div>
  );
}
