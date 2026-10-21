"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

/* ──────────────────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────────────────── */

export type ToastType = "success" | "error" | "info" | "loading" | "tx";

export interface Toast {
  id:       string;
  type:     ToastType;
  title:    string;
  message?: string;
  txHash?:  string;
  chainId?: number;
  duration: number;   // ms; 0 = persist until manually dismissed
}

interface ToastContextValue {
  toasts: Toast[];
  toast:  (opts: Omit<Toast, "id">) => string;
  success:(title: string, message?: string) => string;
  error:  (title: string, message?: string) => string;
  info:   (title: string, message?: string) => string;
  txToast:(title: string, txHash: string, chainId?: number) => string;
  dismiss:(id: string) => void;
  update: (id: string, opts: Partial<Omit<Toast, "id">>) => void;
}

/* ──────────────────────────────────────────────────────────
 *  Context
 * ────────────────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers              = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, "id">): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev.slice(-4), { ...opts, id }]); // cap at 5 visible

      if (opts.duration > 0) {
        const timer = setTimeout(() => dismiss(id), opts.duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (title: string, message?: string) =>
      toast({ type: "success", title, message, duration: 4000 }),
    [toast]
  );

  const error = useCallback(
    (title: string, message?: string) =>
      toast({ type: "error", title, message, duration: 6000 }),
    [toast]
  );

  const info = useCallback(
    (title: string, message?: string) =>
      toast({ type: "info", title, message, duration: 4000 }),
    [toast]
  );

  const txToast = useCallback(
    (title: string, txHash: string, chainId = 43113) =>
      toast({ type: "tx", title, txHash, chainId, duration: 8000 }),
    [toast]
  );

  const update = useCallback(
    (id: string, opts: Partial<Omit<Toast, "id">>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...opts } : t))
      );
      // Reset auto-dismiss timer if duration changes
      if (opts.duration !== undefined && opts.duration > 0) {
        clearTimeout(timers.current.get(id));
        const timer = setTimeout(() => dismiss(id), opts.duration);
        timers.current.set(id, timer);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, txToast, dismiss, update }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
