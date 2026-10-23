"use client";
import { useState, useId } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const sideClass = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full  left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full top-1/2 -translate-y-1/2 mr-2",
  right:  "left-full  top-1/2 -translate-y-1/2 ml-2",
};

export default function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={id}
    >
      {children}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-medium",
            "bg-zinc-900 border border-zinc-700 text-zinc-200 shadow-xl",
            "pointer-events-none select-none",
            sideClass[side]
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}

