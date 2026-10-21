"use client";

import { useEffect, useState } from "react";
import { useToast, type Toast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────
 *  Explorer URL helper
 * ────────────────────────────────────────────────────────── */
function explorerTxUrl(chainId: number, txHash: string): string {
  if (chainId === 43114) return `https://snowtrace.io/tx/${txHash}`;
  return `https://testnet.snowtrace.io/tx/${txHash}`;
}

/* ──────────────────────────────────────────────────────────
 *  Per-toast icons
 * ────────────────────────────────────────────────────────── */
const icons = {
  success: (
    <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    </div>
  ),
  error: (
    <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
  ),
  info: (
    <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    </div>
  ),
  loading: (
    <div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="animate-spin w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20"/>
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-80"/>
      </svg>
    </div>
  ),
  tx: (
    <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
    </div>
  ),
};

const borderColors = {
  success: "border-emerald-500/25",
  error:   "border-red-500/25",
  info:    "border-blue-500/25",
  loading: "border-orange-500/25",
  tx:      "border-violet-500/25",
};

/* ──────────────────────────────────────────────────────────
 *  Single Toast item
 * ────────────────────────────────────────────────────────── */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so CSS animation plays on mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 w-full max-w-sm px-4 py-3.5 rounded-2xl",
        "bg-zinc-900/95 backdrop-blur-xl border shadow-2xl shadow-black/50",
        "transition-all duration-300 ease-out",
        borderColors[toast.type],
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-3 scale-95"
      )}
    >
      {icons[toast.type]}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{toast.message}</p>
        )}
        {/* SnowTrace link for tx toasts */}
        {toast.type === "tx" && toast.txHash && (
          <a
            href={explorerTxUrl(toast.chainId ?? 43113, toast.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-orange-400 hover:text-orange-300 transition-colors font-mono"
          >
            {toast.txHash.slice(0, 12)}…
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            SnowTrace ↗
          </a>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-300 flex-shrink-0 transition-colors mt-0.5"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Toast Container — fixed bottom-right, stacks upward
 * ────────────────────────────────────────────────────────── */
export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[100] flex flex-col-reverse gap-2.5 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>
  );
}
