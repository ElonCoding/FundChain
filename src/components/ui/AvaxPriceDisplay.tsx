"use client";

export default function AvaxPriceDisplay({ amount }: { amount: string }) {
  const inrEstimate = (parseFloat(amount || "0") * 3200).toLocaleString();
  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-400">
      <span className="font-semibold text-white">{amount} AVAX</span>
      <span>≈</span>
      <span className="font-mono text-emerald-400">₹{inrEstimate} INR</span>
    </div>
  );
}
