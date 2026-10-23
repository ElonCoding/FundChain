"use client";

interface ConfirmDialogProps {
  open: boolean; title: string; message: string;
  confirmLabel?: string; cancelLabel?: string; destructive?: boolean;
  onConfirm: () => void; onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message,
  confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false,
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-base font-bold text-white mb-2">{title}</h2>
        <p  className="text-sm text-zinc-400 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button autoFocus onClick={onCancel} className="px-4 py-2 text-sm rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={"px-4 py-2 text-sm rounded-xl font-semibold transition-colors " + (destructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

