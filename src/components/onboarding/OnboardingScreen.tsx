"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  sendPhoneOtp,
  verifyPhoneOtp,
  upsertProfileByPhone,
  SUPABASE_ENABLED,
} from "@/lib/supabase";

/* ──────────────────────────────────────────────────────────
 *  Types
 * ────────────────────────────────────────────────────────── */
type OnboardingStep = "welcome" | "phone" | "otp" | "profile" | "syncing" | "done";

interface OnboardingScreenProps {
  /** Called when setup is complete. App should unmount this screen. */
  onComplete: (displayName: string, phone?: string) => void;
}

const AVATAR_GRADIENTS = [
  { cls: "from-red-500 to-orange-500",     name: "Ember"   },
  { cls: "from-violet-500 to-indigo-500",  name: "Violet"  },
  { cls: "from-emerald-500 to-teal-500",   name: "Jade"    },
  { cls: "from-blue-500 to-cyan-500",      name: "Sky"     },
  { cls: "from-pink-500 to-rose-500",      name: "Rose"    },
  { cls: "from-amber-500 to-yellow-500",   name: "Gold"    },
];

/* ──────────────────────────────────────────────────────────
 *  Main component
 * ────────────────────────────────────────────────────────── */
export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step,          setStep]          = useState<OnboardingStep>("welcome");
  const [phone,         setPhone]         = useState("");
  const [otp,           setOtp]           = useState(["", "", "", "", "", ""]);
  const [displayName,   setDisplayName]   = useState("");
  const [bio,           setBio]           = useState("");
  const [colorIndex,    setColorIndex]    = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null);
  const [resendTimer,   setResendTimer]   = useState(0);
  const [userId,        setUserId]        = useState<string | null>(null);

  // OTP digit refs for auto-focus
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Resend countdown ──────────────────────────────────── */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  /* ── Phone number send ─────────────────────────────────── */
  async function handleSendOtp() {
    setErrorMsg(null);
    const trimmed = phone.trim();

    // Validate E.164 loosely
    if (!trimmed.match(/^\+\d{8,15}$/)) {
      setErrorMsg("Enter phone in international format, e.g. +919876543210");
      return;
    }

    if (!SUPABASE_ENABLED) {
      // Demo mode: skip OTP, go straight to profile
      setStep("profile");
      return;
    }

    setLoading(true);
    const { error } = await sendPhoneOtp(trimmed);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message ?? "Failed to send OTP. Check your number.");
      return;
    }
    setResendTimer(60);
    setStep("otp");
  }

  /* ── OTP input handling ────────────────────────────────── */
  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    if (!digit && index > 0) otpRefs.current[index - 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp() {
    const token = otp.join("");
    if (token.length < 6) return;
    setLoading(true);
    setErrorMsg(null);

    const { session, error } = await verifyPhoneOtp(phone.trim(), token);
    setLoading(false);

    if (error || !session) {
      setErrorMsg("Incorrect code. Try again or resend.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      return;
    }

    setUserId(session.user.id);
    setStep("profile");
  }

  /* ── Profile submit ────────────────────────────────────── */
  async function handleProfileSubmit() {
    if (!displayName.trim()) return;
    setLoading(true);
    setStep("syncing");

    // Upsert Supabase profile if session exists
    if (SUPABASE_ENABLED && userId) {
      await upsertProfileByPhone(
        userId,
        phone.trim(),
        displayName.trim(),
        AVATAR_GRADIENTS[colorIndex].name
      );
    }

    // Simulate sync steps
    await new Promise((r) => setTimeout(r, 1800));
    setStep("done");
    await new Promise((r) => setTimeout(r, 450));
    onComplete(displayName.trim(), phone.trim() || undefined);
  }

  /* ── Shared step wrapper ───────────────────────────────── */
  const stepCls = "flex flex-col items-center text-center px-8 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-400";

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-red-500/8 via-orange-500/5 to-transparent blur-3xl" />
      </div>

      {/* ── WELCOME ────────────────────────────────────────── */}
      {step === "welcome" && (
        <div className={stepCls}>
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/30 to-red-500/20 blur-2xl scale-150" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500 via-orange-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-orange-500/30">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">FundChain</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-2 max-w-[260px]">
            Group payments, transparent fund pools, and real-time messaging.
          </p>
          <p className="text-zinc-600 text-xs mb-8">Powered by Avalanche &amp; Chainlink</p>

          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {["💬 Chat", "💰 Fund Pools", "🎲 Lucky Draw", "⚡ Instant"].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-400">{f}</span>
            ))}
          </div>

          <button
            onClick={() => setStep("phone")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-base hover:shadow-2xl hover:shadow-orange-500/30 active:scale-[0.98] transition-all"
          >
            Get Started
          </button>
          <p className="text-[11px] text-zinc-600 mt-4">No wallet required to start chatting</p>
        </div>
      )}

      {/* ── PHONE NUMBER ───────────────────────────────────── */}
      {step === "phone" && (
        <div className={stepCls}>
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/70 border border-zinc-700/40 flex items-center justify-center mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-orange-400">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.23h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">Enter your number</h2>
          <p className="text-sm text-zinc-500 mb-7">
            {SUPABASE_ENABLED
              ? "We'll send you a one-time verification code"
              : "Demo mode — any number works"}
          </p>

          {/* Country + phone input */}
          <div className="w-full mb-4">
            <div className="relative flex items-center bg-zinc-800/70 border border-zinc-700/50 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/40 focus-within:border-orange-500/40 transition-all">
              <div className="px-4 py-3.5 border-r border-zinc-700/50 text-sm text-zinc-300 font-mono shrink-0 bg-zinc-800/50 select-none">
                🌐
              </div>
              <input
                type="tel"
                inputMode="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrorMsg(null); }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="flex-1 bg-transparent px-4 py-3.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none font-mono"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5 text-left px-1">International format: +[country code][number]</p>
          </div>

          {errorMsg && <p className="text-xs text-red-400 mb-3 text-left w-full px-1">{errorMsg}</p>}

          <button
            onClick={handleSendOtp}
            disabled={loading || !phone.trim()}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm hover:shadow-xl hover:shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? "Sending…" : SUPABASE_ENABLED ? "Send Code" : "Continue →"}
          </button>

          <div className="flex items-center gap-3 w-full my-4">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[11px] text-zinc-600 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <button
            onClick={() => setStep("profile")}
            className="w-full py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 text-zinc-300 font-medium text-xs transition-all flex items-center justify-center gap-2"
          >
            <span>👛</span> Continue with Wallet Only (Skip Phone)
          </button>

          <button onClick={() => setStep("welcome")} className="mt-4 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Back</button>
        </div>
      )}

      {/* ── OTP ────────────────────────────────────────────── */}
      {step === "otp" && (
        <div className={stepCls}>
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-orange-400">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white mb-1">Verify your number</h2>
          <p className="text-sm text-zinc-500 mb-1">Code sent to <span className="text-zinc-300 font-medium font-mono">{phone}</span></p>
          <button onClick={() => { setStep("phone"); setOtp(["","","","","",""]); }} className="text-[11px] text-orange-400/70 hover:text-orange-400 mb-7 transition-colors">Wrong number?</button>

          {/* 6-digit OTP boxes */}
          <div className="flex gap-2.5 mb-5">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={cn(
                  "w-11 h-14 text-center text-xl font-bold rounded-xl border bg-zinc-800/70 text-white transition-all focus:outline-none",
                  digit ? "border-orange-500/60 bg-orange-500/5" : "border-zinc-700/50",
                  "focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50"
                )}
              />
            ))}
          </div>

          {errorMsg && <p className="text-xs text-red-400 mb-3">{errorMsg}</p>}

          <button
            onClick={handleVerifyOtp}
            disabled={loading || otp.join("").length < 6}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm hover:shadow-xl hover:shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? "Verifying…" : "Verify Code"}
          </button>

          <button
            onClick={handleSendOtp}
            disabled={resendTimer > 0 || loading}
            className="mt-4 text-xs text-zinc-500 hover:text-orange-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
          </button>
        </div>
      )}

      {/* ── PROFILE SETUP ──────────────────────────────────── */}
      {step === "profile" && (
        <div className={stepCls}>
          <h2 className="text-xl font-bold text-white mb-1">Set up your profile</h2>
          <p className="text-sm text-zinc-500 mb-6">How should others see you?</p>

          {/* Avatar color + initials preview */}
          <div className="mb-6">
            <div className={cn("w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white mb-4 mx-auto shadow-xl transition-all duration-300", AVATAR_GRADIENTS[colorIndex].cls)}>
              {displayName ? displayName.slice(0, 2).toUpperCase() : "?"}
            </div>
            <div className="flex gap-2.5 justify-center">
              {AVATAR_GRADIENTS.map((g, i) => (
                <button
                  key={i}
                  title={g.name}
                  onClick={() => setColorIndex(i)}
                  className={cn("w-7 h-7 rounded-full bg-gradient-to-br transition-all duration-200", g.cls, i === colorIndex ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110" : "opacity-50 hover:opacity-80 hover:scale-105")}
                />
              ))}
            </div>
          </div>

          <div className="w-full space-y-3 mb-6">
            <input
              type="text"
              placeholder="Display Name *"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleProfileSubmit()}
              maxLength={32}
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all"
              autoFocus
            />
            <input
              type="text"
              placeholder="Short bio (optional)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={80}
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40 transition-all"
            />
          </div>

          <button
            onClick={handleProfileSubmit}
            disabled={!displayName.trim() || loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm hover:shadow-xl hover:shadow-orange-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            Enter FundChain →
          </button>

          {/* Skip note — no wallet required */}
          <p className="text-[10px] text-zinc-600 mt-4">
            💡 You can connect your wallet later in Settings to use fund pools
          </p>
        </div>
      )}

      {/* ── SYNCING ────────────────────────────────────────── */}
      {step === "syncing" && (
        <div className="flex flex-col items-center text-center px-8 max-w-sm w-full animate-in fade-in duration-300">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-red-500/70 animate-spin" style={{ animationDuration: "0.85s", animationDirection: "reverse" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-orange-400">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Setting things up…</h2>
          <p className="text-sm text-zinc-500 mb-6">Finding your conversations</p>
          <div className="w-full space-y-2">
            {[
              { label: "Profile saved",       done: true,  delay: 0    },
              { label: "Loading contacts",     done: true,  delay: 300  },
              { label: "Syncing conversations",done: false, delay: 700  },
              { label: "Almost ready",         done: false, delay: 1200 },
            ].map((s, i) => <SyncStep key={i} {...s} />)}
          </div>
        </div>
      )}

      {/* ── DONE ───────────────────────────────────────────── */}
      {step === "done" && (
        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30 mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome, {displayName}!</h2>
          <p className="text-sm text-zinc-500 mt-1">Loading your world…</p>
        </div>
      )}
    </div>
  );
}

/* ── Spinner ─────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
    </svg>
  );
}

/* ── Sync step item ──────────────────────────────────────────────────────── */
function SyncStep({ label, done, delay }: { label: string; done: boolean; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-800/40 border border-zinc-700/30 transition-all duration-500", visible ? "opacity-100" : "opacity-0")}>
      {done ? (
        <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : (
        <span className="w-5 h-5 rounded-full border-2 border-orange-500/40 border-t-orange-400 animate-spin flex-shrink-0" />
      )}
      <span className="text-sm text-zinc-300 font-medium">{label}</span>
    </div>
  );
}
