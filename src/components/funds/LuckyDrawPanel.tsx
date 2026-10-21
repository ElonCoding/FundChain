"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import { cn } from "@/lib/utils";
import { getExplorerTxUrl } from "@/lib/contracts/chains";
import type { MockPoolDisplay } from "@/lib/mock-data";
import ConnectWalletModal from "@/components/ui/ConnectWalletModal";
import { useWalletGate } from "@/hooks/useWalletGate";

interface LuckyDrawPanelProps {
  pool: MockPoolDisplay;
  isCreator: boolean;
}

type DrawPhase = "idle" | "scrambling" | "slowing" | "done" | "confirming" | "success" | "error";

const SCRAMBLE_DURATION_MS  = 3000;
const SLOW_DURATION_MS      = 1500;
const SCRAMBLE_INTERVAL_MS  = 60;
const SLOW_INTERVAL_MS      = 180;

export default function LuckyDrawPanel({ pool, isCreator }: LuckyDrawPanelProps) {
  const { isConnected } = useAccount();
  const chainId         = useChainId();

  const [phase, setPhase]           = useState<DrawPhase>("idle");
  const [displayed, setDisplayed]   = useState<string>("?");
  const [winner, setWinner]         = useState<{ name: string; address: string; txHash: string } | null>(null);
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [payoutHash, setPayoutHash] = useState<string | null>(null);

  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const scrambleIdxRef = useRef(0);

  const participantNames = pool.participants.map((p) => p.name);

  // ── Clear timers on unmount ───────────────────────────────────────────────
  useEffect(() => () => {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (timeoutRef.current)   clearTimeout(timeoutRef.current);
  }, []);

  // ── Pick a winner from the participant list ───────────────────────────────
  const pickLocalWinner = useCallback(() => {
    // Pseudo-random (mirrors the on-chain approach for the demo)
    const idx    = Math.floor(Math.random() * pool.participants.length);
    return pool.participants[idx];
  }, [pool.participants]);

  // ── Main draw trigger ─────────────────────────────────────────────────────
  const handleStartDraw = useCallback(async () => {
    if (phase !== "idle") return;

    setPhase("scrambling");
    setWinner(null);
    setErrorMsg(null);

    // ── Scramble phase: fast cycling through all names ───────────────────
    intervalRef.current = setInterval(() => {
      const idx = scrambleIdxRef.current % participantNames.length;
      setDisplayed(participantNames[idx]);
      scrambleIdxRef.current++;
    }, SCRAMBLE_INTERVAL_MS);

    // After SCRAMBLE_DURATION_MS → enter slow-down phase
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      setPhase("slowing");

      // Slow phase: gradually decelerate
      let slowTicks = 0;
      const maxSlowTicks = Math.floor(SLOW_DURATION_MS / SLOW_INTERVAL_MS);

      intervalRef.current = setInterval(() => {
        const idx = Math.floor(Math.random() * participantNames.length);
        setDisplayed(participantNames[idx]);
        slowTicks++;

        if (slowTicks >= maxSlowTicks) {
          clearInterval(intervalRef.current!);

          // ── Land on actual winner ─────────────────────────────────────────
          const picked = pickLocalWinner();
          setDisplayed(picked.name);
          setWinner(picked);
          setPhase("done");

          // In production: call usePickWinner() hook here to execute on-chain
          // usePickWinner().pickWinner(BigInt(pool.id));
        }
      }, SLOW_INTERVAL_MS);
    }, SCRAMBLE_DURATION_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, participantNames]);

  // Wallet gate — defined AFTER handleStartDraw so the callback reference is stable
  const drawGate = useWalletGate(handleStartDraw);


  // ── Admin gift/payout after winner selected ───────────────────────────────
  async function handleGiftPayout() {
    if (!winner || !isConnected) return;
    setPhase("confirming");

    try {
      // In production: call usePayoutToRecipient(pool.id, winner.address) here
      await new Promise((r) => setTimeout(r, 1200));  // simulate wallet popup
      await new Promise((r) => setTimeout(r, 2000));  // simulate confirmation
      const mockHash = "0x" + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)).join("");
      setPayoutHash(mockHash);
      setPhase("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Transaction failed");
      setPhase("error");
    }
  }

  const isRunning = phase === "scrambling" || phase === "slowing";

  // ── Colours per phase ────────────────────────────────────────────────────
  const displayColors: Record<DrawPhase, string> = {
    idle:       "text-zinc-500",
    scrambling: "text-amber-400",
    slowing:    "text-orange-400",
    done:       "text-emerald-300",
    confirming: "text-orange-300",
    success:    "text-emerald-300",
    error:      "text-red-400",
  };

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-purple-500/5 overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-violet-500/15 bg-violet-500/5">
        <span className="text-lg">🎲</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-violet-300">Lucky Draw</p>
          <p className="text-[10px] text-zinc-500">{pool.participantCount} participants · winner takes the pot</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-base font-bold text-violet-400">{pool.totalCollected}</span>
          <span className="text-[9px] text-zinc-600 font-mono">Chainlink VRF v2.5</span>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">

        {/* ── Spinning name wheel ─────────────────────────────────────────── */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl bg-zinc-900/80 border border-zinc-800/60 py-8 overflow-hidden">
          {/* Animated ring */}
          {isRunning && (
            <div className="absolute inset-0 rounded-2xl border-2 border-violet-500/40 animate-pulse" />
          )}

          {/* Phase label */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">
            {phase === "idle"       && "Ready to draw"}
            {phase === "scrambling" && "🎰 Shuffling..."}
            {phase === "slowing"    && "⏳ Landing..."}
            {phase === "done"       && "🏆 Winner!"}
            {phase === "confirming" && "⛓ Sending prize..."}
            {phase === "success"    && "✅ Prize sent!"}
            {phase === "error"      && "❌ Error"}
          </p>

          {/* Main display */}
          <div className={cn(
            "text-2xl font-black tracking-tight transition-all duration-75 text-center px-4",
            displayColors[phase],
            isRunning && "blur-[0.5px] scale-105",
            phase === "done" && "scale-110 winner-bounce"
          )}>
            {phase === "idle" ? "?" : displayed}
          </div>

          {/* Winner address tag */}
          {(phase === "done" || phase === "confirming" || phase === "success") && winner && (
            <a
              href={`https://snowtrace.io/address/${winner.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700/50 text-[10px] font-mono text-zinc-400 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              {winner.address}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>

        {/* ── Participant ticker (scrolling strip) ────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {pool.participants.map((p, i) => (
            <span
              key={i}
              className={cn(
                "flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all duration-150",
                winner?.name === p.name
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30"
                  : isRunning && displayed === p.name
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300 scale-105"
                  : "bg-zinc-800/60 border-zinc-700/30 text-zinc-400"
              )}
            >
              {p.name}
            </span>
          ))}
        </div>

        {/* ── CTA buttons ──────────────────────────────────────────────────── */}

        {/* 1. "Find the Winner" button — creator only, idle state */}
        {isCreator && phase === "idle" && pool.status === "active" && (
          <button
            id="find-winner-btn"
            onClick={drawGate.requireWallet}
            disabled={pool.participantCount === 0}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              🎲 Find the Winner
            </span>
            <span className="text-[10px] text-violet-300/60 font-normal flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
              Powered by Chainlink VRF v2.5
            </span>
          </button>
        )}

        {/* Wallet connect modal */}
        {drawGate.show && (
          <ConnectWalletModal
            reason="Connect your wallet as the pool admin to trigger the Chainlink VRF lucky draw."
            {...drawGate.modalProps}
          />
        )}

        {/* 2. Scrambling → disabled button */}
        {isRunning && (
          <button
            disabled
            className="w-full py-3.5 rounded-2xl bg-zinc-800 border border-zinc-700/50 text-zinc-500 font-bold text-sm flex items-center justify-center gap-2.5 cursor-wait"
          >
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
            </svg>
            Drawing winner...
          </button>
        )}

        {/* 3. Winner selected → show "Transfer/Gift the Prize" for creator */}
        {phase === "done" && winner && isCreator && (
          <button
            id="gift-prize-btn"
            onClick={handleGiftPayout}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm hover:shadow-xl hover:shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            🎁 Transfer Prize to {winner.name}
          </button>
        )}

        {/* 4. Confirming tx */}
        {phase === "confirming" && (
          <button disabled className="w-full py-3.5 rounded-2xl bg-zinc-800 border border-zinc-700/50 text-zinc-400 font-bold text-sm flex items-center justify-center gap-2.5 cursor-wait">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
            </svg>
            Confirming on Avalanche...
          </button>
        )}

        {/* 5. Success state */}
        {phase === "success" && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center space-y-2 animate-in fade-in duration-300">
            <p className="text-sm font-semibold text-emerald-300">🎉 Prize Transferred Successfully!</p>
            <p className="text-xs text-zinc-500">
              <span className="text-white font-medium">{pool.totalCollected}</span> sent to{" "}
              <span className="text-emerald-400 font-medium">{winner?.name}</span>
            </p>
            {payoutHash && (
              <a
                href={getExplorerTxUrl(chainId, payoutHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-xs text-zinc-400 hover:text-orange-400 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View on SnowTrace →
              </a>
            )}
          </div>
        )}

        {/* 6. Error state */}
        {phase === "error" && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-xs font-semibold text-red-400 mb-1">Transaction failed</p>
            <p className="text-xs text-zinc-500 mb-2">{errorMsg}</p>
            <button onClick={() => { setPhase("done"); setErrorMsg(null); }} className="text-xs text-orange-400 underline">
              Try again
            </button>
          </div>
        )}

        {/* Non-creator note with VRF security info */}
        {!isCreator && phase === "idle" && (
          <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 px-4 py-3 text-center space-y-1">
            <p className="text-[11px] text-zinc-500">Only the pool creator can trigger the draw</p>
            <p className="text-[10px] text-violet-500/60 flex items-center justify-center gap-1">
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Winner selected via Chainlink VRF v2.5 · verifiably random
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
