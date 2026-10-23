"use client";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> { onClear?: () => void; }

export default function SearchInput({ className, onClear, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <svg className="absolute left-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input type="search" className="w-full pl-8 pr-8 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors" {...props} />
      {onClear && props.value && (
        <button type="button" onClick={onClear} aria-label="Clear search" className="absolute right-2.5 text-zinc-500 hover:text-zinc-300 transition-colors">x</button>
      )}
    </div>
  );
}

