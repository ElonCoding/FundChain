"use client";

import { useState } from "react";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { shortenAddress } from "@/lib/utils";

interface SendAvaxModalProps {
  recipientAddress: string;
  recipientName: string;
  onClose: () => void;
}

export default function SendAvaxModal({
  recipientAddress,
  recipientName,
  onClose,
}: SendAvaxModalProps) {
  const [amount, setAmount] = useState("");
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    try {
      sendTransaction({
        to: recipientAddress as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-[#0A2E22]/40 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-[#F97316]">
              🔺
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Send AVAX (Avalanche Fuji)</h2>
              <p className="text-[11px] text-slate-400">Direct on-chain peer-to-peer transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl mx-auto">
              ✓
            </div>
            <h3 className="text-sm font-bold text-white">Transfer Confirmed!</h3>
            <p className="text-xs text-slate-400">
              Sent {amount} AVAX to {recipientName}.
            </p>
            {hash && (
              <a
                href={`https://testnet.snowtrace.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 underline block"
              >
                View on SnowTrace →
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full mt-3 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-4">
            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error.message}
              </div>
            )}

            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/40">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Recipient</p>
              <p className="text-xs font-semibold text-white mt-0.5">{recipientName}</p>
              <p className="text-[10px] font-mono text-slate-400">{shortenAddress(recipientAddress, 6)}</p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Amount (AVAX)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="0.1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  AVAX
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 border border-slate-700/50 text-xs text-slate-300 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isConfirming || !amount}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-[#F97316] text-white font-bold text-xs hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isPending || isConfirming ? "Confirming…" : "Send Transfer"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
