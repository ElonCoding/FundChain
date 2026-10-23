"use client";
import { cn } from "@/lib/utils";
import Tooltip from "./Tooltip";

type IBS = "sm" | "md" | "lg";
type IBV = "ghost" | "outline" | "solid";
const S: Record<IBS, string> = { sm: "w-7 h-7 text-sm", md: "w-9 h-9 text-base", lg: "w-11 h-11 text-lg" };
const V: Record<IBV, string> = {
  ghost:   "hover:bg-zinc-800/60",
  outline: "border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/40",
  solid:   "bg-zinc-800 hover:bg-zinc-700",
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode; label: string; size?: IBS; variant?: IBV; tooltip?: boolean;
}

export default function IconButton({ icon, label, size = "md", variant = "ghost", tooltip = true, className, ...props }: IconButtonProps) {
  const btn = (
    <button aria-label={label} className={cn("inline-flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 transition-all active:scale-95", S[size], V[variant], className)} {...props}>
      {icon}
    </button>
  );
  return tooltip ? <Tooltip content={label}>{btn}</Tooltip> : btn;
}

