"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import anime from "animejs";
import FundChainLogo from "@/components/ui/FundChainLogo";
import ThreeExperience from "@/components/ui/ThreeExperience";
import {
  InteractivePoolCard,
  InteractiveChatCard,
  InteractiveLuckyDrawCard,
} from "@/components/ui/InteractiveShowcaseCards";
import BentoGridFeatures from "@/components/ui/BentoGridFeatures";
import LiveMetricsBar from "@/components/ui/LiveMetricsBar";

/* ─── Wallet Connection Button ───────────────────────────────────────── */
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-sm font-semibold hover:border-emerald-400 transition-all shadow-lg shadow-emerald-950/40"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {address.slice(0, 6)}…{address.slice(-4)}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#07131F] border border-emerald-500/30 rounded-2xl shadow-2xl p-2 z-50">
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
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
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-bold hover:from-emerald-500 hover:to-teal-400 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all"
      >
        <span>Connect Wallet</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-[#07131F] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl">
          <div className="px-4 py-3 border-b border-zinc-800 bg-[#040D18]/80">
            <p className="text-xs font-bold text-zinc-200">Connect Web3 Wallet</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Avalanche Fuji C-Chain (43113)</p>
          </div>
          <div className="p-3 space-y-2">
            {connectors
              .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i)
              .map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => connect({ connector })}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#0B1E28]/70 border border-zinc-700/60 text-sm text-zinc-200 font-medium hover:border-emerald-500/50 hover:bg-[#0B1E28] transition-all disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    ⬡
                  </div>
                  <span>{connector.name}</span>
                  {isPending && (
                    <svg className="animate-spin w-4 h-4 ml-auto text-emerald-400" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                  )}
                </button>
              ))}
            {connectors.length === 0 && (
              <p className="text-center text-xs text-zinc-400 py-3">Install Core or MetaMask to connect</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Landing Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Anime.js hero stagger orchestration
    const tl = anime.timeline({
      easing: "easeOutExpo",
      duration: 1000,
    });

    tl.add({
      targets: ".anime-badge",
      opacity: [0, 1],
      translateY: [-15, 0],
      duration: 600,
    })
      .add(
        {
          targets: ".anime-headline",
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 900,
        },
        "-=400"
      )
      .add(
        {
          targets: ".anime-sub",
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 700,
        },
        "-=600"
      )
      .add(
        {
          targets: ".anime-cta",
          opacity: [0, 1],
          scale: [0.95, 1],
          duration: 600,
        },
        "-=500"
      )
      .add(
        {
          targets: ".anime-3d-box",
          opacity: [0, 1],
          scale: [0.92, 1],
          duration: 1100,
        },
        "-=600"
      );

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function goToDashboard() {
    router.push("/dashboard");
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#040D18] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030913] text-white selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      {/* ── Ambient Background Lighting ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[1100px] h-[750px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(16,185,129,0.25) 0%, rgba(6,78,59,0.15) 45%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 70%)",
          }}
        />
        {/* Subtle Cyber Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16,185,129,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16,185,129,0.4) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── Fixed Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-[#040D18]/90 backdrop-blur-xl border-b border-zinc-800/80 shadow-2xl" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <FundChainLogo size="md" />

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#experience" className="text-sm text-zinc-400 hover:text-emerald-300 font-medium transition-colors">
              3D Spatial
            </a>
            <a href="#showcase" className="text-sm text-zinc-400 hover:text-emerald-300 font-medium transition-colors">
              Live Protocol
            </a>
            <a href="#features" className="text-sm text-zinc-400 hover:text-emerald-300 font-medium transition-colors">
              Bento Architecture
            </a>
            <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-emerald-300 font-medium transition-colors">
              Workflow
            </a>
          </div>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <LandingWalletBtn onConnected={goToDashboard} />
            <button
              onClick={goToDashboard}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 text-xs font-bold text-zinc-300 hover:text-white transition-all hidden sm:block"
            >
              Open App →
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 pt-32 pb-20 px-6 flex flex-col items-center text-center max-w-7xl mx-auto">
        {/* Top Status Pill */}
        <div className="anime-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400 shadow-lg shadow-emerald-950/30 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Avalanche Fuji C-Chain · Realtime Web3 Protocol</span>
        </div>

        {/* Hero Headline */}
        <h1 className="anime-headline text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02] max-w-5xl">
          Fund People. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Verify Every Cent.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="anime-sub mt-6 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          The sovereign Web3 workspace for group treasuries, zero-gas cryptographic messaging, and provably fair prize
          draws — built natively on Avalanche.
        </p>

        {/* CTAs */}
        <div className="anime-cta mt-8 flex flex-col sm:flex-row items-center gap-4">
          <LandingWalletBtn onConnected={goToDashboard} />
          <button
            onClick={goToDashboard}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#07131F] border border-zinc-700/80 hover:border-emerald-500/50 text-sm font-semibold text-zinc-200 hover:text-white transition-all"
          >
            <span>Explore Dashboard</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* ── 3D SPATIAL WEBGL CONTAINER ── */}
        <div
          id="experience"
          className="anime-3d-box mt-14 w-full max-w-5xl relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500/30 via-zinc-800/40 to-transparent shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
        >
          <div className="w-full h-[460px] sm:h-[540px] rounded-[22px] bg-[#040D18]/90 overflow-hidden relative border border-emerald-500/20 backdrop-blur-2xl">
            <ThreeExperience className="w-full h-full" />
          </div>
        </div>
      </section>

      {/* ── LIVE METRICS TICKER BAR (Anime.js animated) ── */}
      <section className="relative z-10 py-10">
        <LiveMetricsBar />
      </section>

      {/* ── LIVE PROTOCOL SHOWCASE CARDS ── */}
      <section id="showcase" className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Live Protocol Mechanics</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Interact Directly with the Chain
          </h2>
          <p className="text-zinc-400 mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Test real calculations, simulate on-chain state anchoring, and spin the verifiable randomness engine below.
          </p>
        </div>

        {/* 3 Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InteractivePoolCard />
          <InteractiveChatCard />
          <InteractiveLuckyDrawCard />
        </div>
      </section>

      {/* ── BENTO GRID FEATURES ── */}
      <section id="features" className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mb-3">Modular Architecture</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Engineered for Transparency
          </h2>
          <p className="text-zinc-400 mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Every layer from client-side cryptography to Avalanche smart contract logic is open and inspectable.
          </p>
        </div>

        <BentoGridFeatures />
      </section>

      {/* ── 3-STEP WORKFLOW ── */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="text-center mb-16">
          <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3">Streamlined UX</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            How FundChain Operates
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            {
              step: "01",
              title: "Connect Fuji Wallet",
              desc: "Instant Web3 authentication via MetaMask, Core, or Coinbase. Zero seed phrase exposure; your private keys never leave your custody.",
              icon: "🔑",
            },
            {
              step: "02",
              title: "Launch or Join a Vault",
              desc: "Configure target amounts, deadlines, and disbursement rules. Every contribution is escrowed directly into verified Fuji contracts.",
              icon: "🛡️",
            },
            {
              step: "03",
              title: "Chat & Verify Provably",
              desc: "Engage in zero-gas team discussions. When ready, trigger automated disbursement or provably fair lucky draws with one click.",
              icon: "✨",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="relative p-8 rounded-3xl bg-[#06121C]/80 border border-zinc-800/80 hover:border-emerald-500/40 transition-all duration-300 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <span className="text-3xl font-black text-zinc-700 font-mono">{item.step}</span>
                <span className="text-2xl p-2.5 rounded-2xl bg-zinc-900 border border-zinc-700/60">{item.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AVALANCHE NETWORK INFORMATION BANNER ── */}
      <section className="relative z-10 py-16 px-6 max-w-6xl mx-auto">
        <div className="rounded-3xl p-8 bg-gradient-to-r from-red-950/20 via-[#0C1E28] to-emerald-950/20 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-red-400 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Avalanche Fuji Testnet Environment</span>
            </div>
            <h3 className="text-2xl font-black text-white">Need free Fuji Testnet AVAX?</h3>
            <p className="text-xs text-zinc-400 max-w-lg">
              Get free test tokens instantly from the official Avalanche faucet to test fund pooling, deposits, and
              instant message hashing without real money.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://core.app/tools/testnet-faucet/?subnet=c&token=c"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5"
            >
              <span>Fuji Faucet</span>
              <span>↗</span>
            </a>
            <a
              href="https://testnet.snowtrace.io"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <span>SnowTrace Explorer</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-12 px-6 border-t border-zinc-900 bg-[#02060D] text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <FundChainLogo size="sm" />
          <div className="flex items-center gap-6">
            <span className="text-zinc-400">Avalanche Fuji C-Chain (43113)</span>
            <span>·</span>
            <span className="text-emerald-400">Zero-Gas Realtime Chat</span>
            <span>·</span>
            <span className="text-teal-300">Non-Custodial Escrow</span>
          </div>
          <p>© {new Date().getFullYear()} FundChain. Sovereign Community Treasury.</p>
        </div>
      </footer>
    </div>
  );
}
