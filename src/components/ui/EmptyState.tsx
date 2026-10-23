"use client";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon = "ðŸ“­", title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 px-8 text-center", className)}>
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-semibold text-zinc-300">{title}</p>
      {description && <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

