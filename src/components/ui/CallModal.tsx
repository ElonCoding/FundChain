"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";

export type CallType = "voice" | "video";

interface CallModalProps {
  contactName: string;
  callType: CallType;
  onEnd: () => void;
}

type CallPhase = "ringing" | "connected";

export default function CallModal({ contactName, callType, onEnd }: CallModalProps) {
  const [phase, setPhase]   = useState<CallPhase>("ringing");
  const [seconds, setSeconds] = useState(0);
  const [muted,   setMuted]   = useState(false);
  const [camOff,  setCamOff]  = useState(false);
  const [speaker, setSpeaker] = useState(true);

  // Auto-answer after 2s (demo)
  useEffect(() => {
    const t = setTimeout(() => setPhase("connected"), 2000);
    return () => clearTimeout(t);
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "connected") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  function formatDuration(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl" />

      {callType === "video" ? (
        /* ── VIDEO CALL layout ──────────────────────────────────────────── */
        <div className="relative w-full h-full flex flex-col">
          {/* Remote video (placeholder) */}
          <div className="flex-1 bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-indigo-500/5" />
            {camOff ? (
              <div className="flex flex-col items-center gap-4">
                <Avatar name={contactName} size="xl" />
                <p className="text-zinc-400 text-sm">Camera off</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Avatar name={contactName} size="xl" />
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-emerald-400 animate-pulse"
                      style={{
                        height: `${12 + Math.random() * 20}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* Status banner */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-700/50 backdrop-blur-sm">
              <p className="text-sm text-zinc-300 font-medium">
                {phase === "ringing" ? `Calling ${contactName}…` : `${contactName} · ${formatDuration(seconds)}`}
              </p>
            </div>
            {/* Self preview (PiP) */}
            <div className="absolute bottom-32 right-6 w-28 h-40 rounded-2xl bg-zinc-800/80 border border-zinc-700/40 overflow-hidden shadow-2xl flex items-center justify-center">
              <Avatar name="You" size="md" />
            </div>
          </div>

          {/* Controls bar */}
          <CallControls
            phase={phase}
            muted={muted}     onToggleMute={() => setMuted(!muted)}
            camOff={camOff}   onToggleCam={() => setCamOff(!camOff)}
            speaker={speaker} onToggleSpeaker={() => setSpeaker(!speaker)}
            onEnd={onEnd}
            showCamera
          />
        </div>

      ) : (
        /* ── VOICE CALL layout ──────────────────────────────────────────── */
        <div className="relative z-10 flex flex-col items-center w-full max-w-xs px-8">
          {/* Avatar with ripple rings */}
          <div className="relative mb-8">
            {phase === "ringing" && (
              <>
                <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping scale-150" />
                <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-ping scale-[2.5]" style={{ animationDelay: "0.3s" }} />
              </>
            )}
            <div className="relative w-28 h-28 rounded-full shadow-2xl">
              <Avatar name={contactName} size="xl" />
              {phase === "connected" && (
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-zinc-950 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-white">
                    <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">{contactName}</h2>
          <p className="text-sm text-zinc-400 mb-10">
            {phase === "ringing" ? "Calling…" : `${formatDuration(seconds)}`}
          </p>

          {/* Audio waveform (connected state) */}
          {phase === "connected" && (
            <div className="flex items-end gap-1 h-8 mb-10">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-orange-500 to-amber-400 animate-pulse"
                  style={{
                    height: `${8 + Math.random() * 24}px`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: `${0.6 + Math.random() * 0.4}s`,
                  }}
                />
              ))}
            </div>
          )}

          <CallControls
            phase={phase}
            muted={muted}     onToggleMute={() => setMuted(!muted)}
            speaker={speaker} onToggleSpeaker={() => setSpeaker(!speaker)}
            onEnd={onEnd}
          />
        </div>
      )}
    </div>
  );
}

/* ── Shared call controls ─────────────────────────────────────────────────── */
interface ControlsProps {
  phase: CallPhase;
  muted: boolean; onToggleMute: () => void;
  speaker: boolean; onToggleSpeaker: () => void;
  camOff?: boolean; onToggleCam?: () => void;
  onEnd: () => void;
  showCamera?: boolean;
}

function CallControls({ phase, muted, onToggleMute, speaker, onToggleSpeaker, camOff, onToggleCam, onEnd, showCamera }: ControlsProps) {
  return (
    <div className={cn(
      "flex items-center justify-center gap-5",
      showCamera ? "absolute bottom-8 left-0 right-0 px-8" : ""
    )}>
      {/* Mute */}
      <ControlBtn
        active={muted}
        activeClass="bg-amber-500/20 border-amber-500/40 text-amber-400"
        label={muted ? "Unmute" : "Mute"}
        onClick={onToggleMute}
      >
        {muted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4M8 23h8"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z"/>
          </svg>
        )}
      </ControlBtn>

      {/* Camera (video calls) */}
      {showCamera && onToggleCam && (
        <ControlBtn active={!!camOff} activeClass="bg-amber-500/20 border-amber-500/40 text-amber-400" label={camOff ? "Camera On" : "Camera Off"} onClick={onToggleCam}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            {camOff ? (
              <><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/><path d="M15 13a3 3 0 1 1-4.24-2.76"/></>
            ) : (
              <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>
            )}
          </svg>
        </ControlBtn>
      )}

      {/* End call */}
      <button
        onClick={onEnd}
        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-500/40 active:scale-95 transition-all"
        aria-label="End call"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 rotate-[135deg]">
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
        </svg>
      </button>

      {/* Speaker */}
      <ControlBtn active={!speaker} activeClass="bg-amber-500/20 border-amber-500/40 text-amber-400" label="Speaker" onClick={onToggleSpeaker}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          {speaker ? (
            <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
          ) : (
            <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
          )}
        </svg>
      </ControlBtn>
    </div>
  );
}

function ControlBtn({ active, activeClass, onClick, label, children }: {
  active: boolean; activeClass: string; onClick: () => void; label: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "w-14 h-14 rounded-full border flex items-center justify-center transition-all active:scale-90",
        active
          ? activeClass
          : "bg-zinc-800/80 border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-700/80"
      )}
    >
      {children}
    </button>
  );
}
