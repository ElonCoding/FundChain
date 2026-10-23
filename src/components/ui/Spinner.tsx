"use client";

interface SpinnerProps { size?: "sm" | "md" | "lg"; className?: string; }

const sizeMap = { sm: "w-4 h-4 border-2", md: "w-6 h-6 border-2", lg: "w-10 h-10 border-[3px]" };

/** Accessible loading spinner with configurable size. */
export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-zinc-600 border-t-emerald-500 animate-spin ${sizeMap[size]} ${className}`}
    />
  );
}

