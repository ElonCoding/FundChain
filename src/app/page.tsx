"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import FundChainLogo from "@/components/ui/FundChainLogo";

/* ─── Animated background grid node ─────────────────────────────────── */
function GridNode({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <div
      className="absolute w-8 h-8 rounded-lg border border-[#16A34A]/20 flex items-center justify-center"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}s`,
      }}
    >
      <div className="w-1 h-1 rounded-full bg-[#16A34A]/40 animate-pulse" />
    </div>
  );
}

/* ─── Floating stat card ─────────────────────────────────────────────── */
function StatCard({
  label, value, sub, side, delay
}: { label: string; value: string; sub: string; side: "left" | "right"; delay: number }) {
  return (
    <div
      className={`absolute ${side === "left" ? "left-6 md:left-16" : "right-6 md:right-16"} bg-[#0A1628]/95 border border-[#16A34A]/20 rounded-2xl p-4 shadow-2xl backdrop-blur-xl`}
      style={{
        animation: `floatCard 6s ease-in-out ${delay}s infinite`,
        bottom: side === "left" ? "30%" : "22%",
        minWidth: "180px",
      }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest">{label}</p>
        <span className="text-[10px] text-emerald-400/60 bg-emerald-400/10 px-2 py-0.5 rounded-full">On · Chain</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>
    </div>
  );
}

/* ─── WalletButton for landing ───────────────────────────────────────── */
function LandingWalletBtn({ onConnected }: { onConnected: () => void }) {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isConnected) {
      setOpen(false);
      onConnected();
    }
  }, [isConnected, onConnected]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isConnected && address) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A2E22] border border-[#16A34A]/40 text-emerald-300 text-sm font-semibold hover:border-[#16A34A]/70 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {address.slice(0, 6)}…{address.slice(-4)}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#0A1628] border border-[#16A34A]/20 rounded-2xl shadow-2xl p-2">
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold hover:bg-[#15803d] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 transition-all"
      >
        Connect Wallet
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-[#0A1628] border border-[#16A34A]/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#16A34A]/10">
            <p className="text-xs font-bold text-zinc-300">Choose a wallet</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">Avalanche Fuji C-Chain (43113)</p>
          </div>
          <div className="p-3 space-y-2">
            {connectors.filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i).map((connector) => (
              <button
                key={connector.uid}
                onClick={() => { connect({ connector }); }}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#0F2D1F]/60 border border-[#16A34A]/20 text-sm text-zinc-200 font-medium hover:bg-[#0F2D1F] hover:border-[#16A34A]/50 transition-all disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/20 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-400">
                    <rect x="1" y="5" width="22" height="14" rx="3" />
                    <path d="M1 10h22" />
                    <circle cx="17" cy="15" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <span>{connector.name}</span>
                {isPending && (
                  <svg className="animate-spin w-3.5 h-3.5 ml-auto text-emerald-500" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                )}
              </button>
            ))}
            {connectors.length === 0 && (
              <p className="text-center text-xs text-zinc-500 py-3">
                Install MetaMask and refresh to connect
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Feature pill ───────────────────────────────────────────────────── */
function FeaturePill({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A2E22]/80 border border-[#16A34A]/25 text-sm text-zinc-300">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/* ─── Metric block ───────────────────────────────────────────────────── */
function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl md:text-4xl font-black text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">{label}</p>
    </div>
  );
}

/* ─── Feature card ───────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-[#080F1A] border border-zinc-800/60 hover:border-[#16A34A]/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-900/20">
      <div className="w-12 h-12 rounded-xl bg-[#0A2E22] border border-[#16A34A]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Main landing page ──────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function goToDashboard() {
    router.push("/dashboard");
  }

  // Grid nodes for background decoration
  const gridNodes = [
    { x: 5,  y: 15, delay: 0   },
    { x: 15, y: 45, delay: 0.5 },
    { x: 8,  y: 75, delay: 1   },
    { x: 88, y: 20, delay: 0.8 },
    { x: 92, y: 55, delay: 0.3 },
    { x: 85, y: 80, delay: 1.2 },
    { x: 50, y: 8,  delay: 0.6 },
    { x: 30, y: 90, delay: 1.5 },
    { x: 70, y: 85, delay: 0.2 },
  ];

  if (!mounted) return (
    <div className="min-h-screen bg-[#040D18] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#16A34A] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#040D18] overflow-x-hidden">

      {/* ── Global CSS animations ──────────────────────────────────── */}
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes heroGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.8; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .hero-text { animation: slideUp 0.8s ease forwards; }
        .hero-text-2 { animation: slideUp 0.8s ease 0.15s forwards; opacity: 0; }
        .hero-text-3 { animation: slideUp 0.8s ease 0.3s forwards; opacity: 0; }
        .hero-cta { animation: slideUp 0.8s ease 0.45s forwards; opacity: 0; }
        .hero-pills { animation: slideUp 0.8s ease 0.6s forwards; opacity: 0; }
      `}</style>

      {/* ── Ambient background glow ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Central hero glow */}
        <div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(22,163,74,0.12) 0%, rgba(10,46,34,0.08) 40%, transparent 70%)",
            animation: "heroGlow 8s ease-in-out infinite",
          }}
        />
        {/* Bottom glow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, rgba(22,163,74,0.06) 0%, transparent 70%)",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(22,163,74,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(22,163,74,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
        {/* Animated grid nodes */}
        {gridNodes.map((n, i) => <GridNode key={i} {...n} />)}
      </div>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#040D18]/95 backdrop-blur-xl border-b border-[#16A34A]/10 shadow-2xl" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <FundChainLogo size="md" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features",  href: "#features"  },
              { label: "How it works", href: "#how-it-works" },
              { label: "Network",   href: "#network"   },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-400 hover:text-white transition-colors font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3">
            {mounted && <LandingWalletBtn onConnected={goToDashboard} />}
            <button
              onClick={goToDashboard}
              className="px-5 py-2.5 rounded-xl border border-[#16A34A]/40 text-emerald-300 text-sm font-semibold hover:bg-[#0A2E22]/60 transition-all hidden sm:block"
            >
              Dashboard →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">

        {/* Auto-sync badge */}
        <div className="hero-text mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0A2E22]/80 border border-[#16A34A]/30 text-xs text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Auto-sync live · Avalanche Fuji C-Chain
        </div>

        {/* Hero headline — fundryx-style */}
        <h1 className="hero-text-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[0.95] max-w-5xl">
          Fund People.
          <br />
          <span
            className="italic font-black"
            style={{
              background: "linear-gradient(135deg, #16A34A 0%, #6EE7B7 50%, #16A34A 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Build Communities.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="hero-text-3 mt-6 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed font-medium">
          Transparent on-chain fund pools, real-time messaging, and verifiable lucky draws —
          all in{" "}
          <span className="text-white font-semibold">one calm workspace</span>{" "}
          on Avalanche.
        </p>

        {/* CTA buttons */}
        <div className="hero-cta mt-10 flex flex-col sm:flex-row items-center gap-4">
          {mounted && <LandingWalletBtn onConnected={goToDashboard} />}
          <button
            onClick={goToDashboard}
            className="flex items-center gap-2 px-7 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-semibold text-sm hover:border-zinc-500 hover:text-white transition-all"
          >
            Explore Dashboard
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Feature pills */}
        <div className="hero-pills mt-10 flex flex-wrap items-center justify-center gap-3">
          <FeaturePill icon="💬" text="On-Chain Chat" />
          <FeaturePill icon="💰" text="Group Vaults" />
          <FeaturePill icon="🎲" text="Lucky Draw" />
          <FeaturePill icon="⚡" text="Avalanche Fuji" />
          <FeaturePill icon="🔗" text="Zero Gas Chat" />
        </div>

        {/* Floating stat cards — left & right */}
        <StatCard label="Cash Out" value="$ 0.00" sub="↑ 0.0%  from last month" side="left" delay={0} />
        <StatCard label="Cash In"  value="$ 0.00" sub="↑ 0.0%  from last month" side="right" delay={1} />

        {/* Hero logo orb */}
        <div className="mt-16 relative">
          <div
            className="w-48 h-48 md:w-64 md:h-64 rounded-[40px] flex items-center justify-center shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #0A2E22 0%, #0F3828 40%, #16A34A22 100%)",
              border: "1px solid rgba(22,163,74,0.3)",
              boxShadow: "0 0 80px rgba(22,163,74,0.2), 0 40px 80px rgba(0,0,0,0.5)",
            }}
          >
            <img src="/logo.png" alt="FundChain" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl" />
          </div>
          {/* Glow ring */}
          <div
            className="absolute inset-0 rounded-[40px] opacity-30 blur-2xl"
            style={{ background: "linear-gradient(135deg, #16A34A, #6EE7B7)" }}
          />
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-40">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Scroll to explore</p>
          <div className="w-px h-8 bg-gradient-to-b from-zinc-500 to-transparent" />
        </div>
      </section>

      {/* ── METRICS BAR ─────────────────────────────────────────── */}
      <section className="relative py-12 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Metric value="43113" label="Chain ID (Fuji)" />
            <Metric value="< 2s"  label="Block Time" />
            <Metric value="$0"    label="Chat Gas Fee" />
            <Metric value="100%"  label="On-Chain Audit" />
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ─────────────────────────────────────── */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-[#16A34A] uppercase tracking-widest mb-3">What you get</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Everything your group needs
            </h2>
            <p className="text-zinc-500 mt-4 max-w-xl mx-auto">
              One platform. Transparent money. Real-time communication. Verifiable fairness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon="💬"
              title="Real-Time Chat"
              desc="Instant group and private messaging. Zero gas fees. Every message hashed on Avalanche Fuji for full auditability."
            />
            <FeatureCard
              icon="💰"
              title="Group Fund Pools"
              desc="Create transparent money pools. Fixed or flexible contribution schedules. Every deposit tracked on-chain — no trust required."
            />
            <FeatureCard
              icon="🎲"
              title="Verifiable Lucky Draw"
              desc="Provably fair winner selection using on-chain randomness. No one can rig it — not even the admin."
            />
            <FeatureCard
              icon="🔗"
              title="Full Audit Trail"
              desc="Every transaction, message hash, and pool action permanently recorded. Browse the entire history on SnowTrace."
            />
            <FeatureCard
              icon="👥"
              title="Contact Management"
              desc="Add contacts by wallet address or phone. Smart deduplication. Start conversations and fund collections instantly."
            />
            <FeatureCard
              icon="📊"
              title="Admin Dashboard"
              desc="Real-time overview of pool health, member contributions, and pending payouts. Full trail export for compliance."
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="relative py-24 px-6 bg-[#050E1A]/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold text-[#16A34A] uppercase tracking-widest mb-3">Simple steps</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-16">
            How FundChain works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Connect Your Wallet",
                desc: "Connect MetaMask or any EIP-1193 wallet. Switch to Avalanche Fuji C-Chain (43113). That's it — you're on-chain.",
              },
              {
                step: "02",
                title: "Create or Join a Pool",
                desc: "Start a group fund, set contribution amount and schedule. Invite members by wallet address or phone number.",
              },
              {
                step: "03",
                title: "Contribute & Withdraw",
                desc: "All contributions go directly to the smart contract. The winner — chosen fairly on-chain — withdraws with one click.",
              },
            ].map((s) => (
              <div key={s.step} className="relative p-6 rounded-2xl bg-[#080F1A] border border-zinc-800/60">
                <p
                  className="text-6xl font-black mb-4"
                  style={{
                    background: "linear-gradient(135deg, #16A34A20, #16A34A50)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {s.step}
                </p>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NETWORK SECTION ──────────────────────────────────────── */}
      <section id="network" className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold text-[#16A34A] uppercase tracking-widest mb-3">Infrastructure</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Built on Avalanche
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-12">
            Avalanche C-Chain gives us sub-2-second finality, EVM compatibility,
            and negligible transaction costs — without sacrificing decentralisation.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Network",   value: "Fuji Testnet" },
              { label: "Chain ID",  value: "43113" },
              { label: "Currency",  value: "AVAX" },
              { label: "Explorer",  value: "SnowTrace" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-[#0A2E22]/40 border border-[#16A34A]/20">
                <p className="text-[10px] text-[#16A34A] uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-sm font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
          <a
            href="https://testnet.snowtrace.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
          >
            View contracts on SnowTrace ↗
          </a>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="relative rounded-3xl p-12 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0A2E22 0%, #0A1628 100%)",
              border: "1px solid rgba(22,163,74,0.25)",
              boxShadow: "0 0 80px rgba(22,163,74,0.08)",
            }}
          >
            {/* Glow blob */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 blur-3xl opacity-20"
              style={{ background: "radial-gradient(ellipse, #16A34A, transparent)" }}
            />
            <p className="relative text-xs font-bold text-[#16A34A] uppercase tracking-widest mb-4">Get started now</p>
            <h2 className="relative text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
              Ready to fund your community?
            </h2>
            <p className="relative text-zinc-400 mb-10 text-lg">
              Connect your wallet and launch your first fund pool in under 60 seconds.
            </p>
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
              {mounted && <LandingWalletBtn onConnected={goToDashboard} />}
              <button
                onClick={goToDashboard}
                className="px-7 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-semibold text-sm hover:border-zinc-500 hover:text-white transition-all"
              >
                Open Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <FundChainLogo size="sm" />
          <p className="text-xs text-zinc-600">
            Built on Avalanche Fuji C-Chain · Chain ID 43113 · Open Source
          </p>
          <div className="flex items-center gap-4">
            <a href="https://testnet.snowtrace.io" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-600 hover:text-emerald-400 transition-colors">
              SnowTrace ↗
            </a>
            <a href="/dashboard" className="text-xs text-zinc-600 hover:text-emerald-400 transition-colors">
              Dashboard
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
