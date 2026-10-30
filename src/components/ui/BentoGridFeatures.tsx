"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

interface FeatureItem {
  icon: string;
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  gradient: string;
  borderGlow: string;
  colSpan?: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: "💎",
    badge: "Non-Custodial",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    title: "Autonomous Pool Escrow",
    description: "Deposit AVAX into immutable smart contracts. Automated payout rules execute on-chain without middlemen or manual custody risks.",
    metric: "$0 Escrow Fee",
    metricLabel: "100% peer disbursement",
    gradient: "from-emerald-950/40 via-[#0B1F19]/50 to-transparent",
    borderGlow: "hover:border-emerald-500/50",
    colSpan: "lg:col-span-2",
  },
  {
    icon: "⚡",
    badge: "Sub-Second",
    badgeColor: "text-teal-300 bg-teal-500/10 border-teal-500/30",
    title: "Avalanche Fuji Finality",
    description: "Instant transaction confirmation with near-zero gas overhead on Avalanche C-Chain testnet.",
    metric: "< 1.8s",
    metricLabel: "Average block time",
    gradient: "from-teal-950/40 via-[#09221D]/50 to-transparent",
    borderGlow: "hover:border-teal-500/50",
    colSpan: "lg:col-span-1",
  },
  {
    icon: "🔒",
    badge: "Cryptographic",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
    title: "Zero-Gas State Hashing",
    description: "Conversations stream live through Supabase Realtime while batch SHA-256 state roots anchor to Fuji for tamper-proof audit trails.",
    metric: "0 Gas",
    metricLabel: "Per message sent",
    gradient: "from-cyan-950/40 via-[#071C26]/50 to-transparent",
    borderGlow: "hover:border-cyan-500/50",
    colSpan: "lg:col-span-1",
  },
  {
    icon: "🎲",
    badge: "Verifiable",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    title: "Provably Fair Lucky Draws",
    description: "Smart contract random seed extraction guarantees unpredictable, unriggable prize distribution to pool participants.",
    metric: "VRF Seeded",
    metricLabel: "Zero manipulation risk",
    gradient: "from-purple-950/40 via-[#190D2B]/50 to-transparent",
    borderGlow: "hover:border-purple-500/50",
    colSpan: "lg:col-span-2",
  },
  {
    icon: "🌐",
    badge: "Privacy Preserved",
    badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/30",
    title: "Cross-Identity Contact Book",
    description: "Link wallet addresses to phone numbers and custom handles with zero-knowledge cryptographic hashes. Keep your real identity private.",
    metric: "Instant",
    metricLabel: "Address resolution",
    gradient: "from-sky-950/40 via-[#0B2135]/50 to-transparent",
    borderGlow: "hover:border-sky-500/50",
    colSpan: "lg:col-span-1",
  },
  {
    icon: "🔍",
    badge: "SnowTrace Explorer",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    title: "Auditable Trail & Receipts",
    description: "Every deposit, withdraw, winner draw, and admin action generates cryptographic verifiable receipts with direct SnowTrace links.",
    metric: "100%",
    metricLabel: "On-chain accountability",
    gradient: "from-amber-950/40 via-[#261B07]/50 to-transparent",
    borderGlow: "hover:border-amber-500/50",
    colSpan: "lg:col-span-2",
  },
];

export default function BentoGridFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    anime({
      targets: ".bento-card",
      translateY: [25, 0],
      opacity: [0, 1],
      delay: anime.stagger(100),
      duration: 800,
      easing: "easeOutCubic",
    });
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map((item, idx) => (
        <div
          key={idx}
          className={`bento-card group relative rounded-3xl p-7 bg-[#07131F]/90 border border-zinc-800/80 ${item.borderGlow} transition-all duration-500 shadow-xl hover:shadow-2xl hover:-translate-y-1 ${item.colSpan || ""}`}
        >
          {/* Subtle gradient backdrop */}
          <div
            className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.gradient} opacity-40 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none`}
          />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#040D18] border border-zinc-700/60 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <span className={`text-[11px] font-semibold px-3 py-1 rounded-full border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight group-hover:text-emerald-300 transition-colors">
                {item.title}
              </h3>

              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                {item.description}
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-zinc-800/60 flex items-baseline justify-between">
              <div>
                <p className="text-xl font-black text-white">{item.metric}</p>
                <p className="text-[11px] text-zinc-500">{item.metricLabel}</p>
              </div>
              <span className="text-xs text-emerald-400/80 font-semibold group-hover:translate-x-1 transition-transform">
                Details →
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

