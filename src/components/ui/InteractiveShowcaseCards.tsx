"use client";

import { useState, useEffect } from "react";
import anime from "animejs";

export function InteractivePoolCard() {
  const [pledgeAmount, setPledgeAmount] = useState(5);
  const basePool = 42800;
  const currentTotal = basePool + pledgeAmount * 45;
  const target = 50000;
  const percentage = Math.min(100, Math.round((currentTotal / target) * 100));

  const handlePledge = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPledgeAmount(Number(e.target.value));
  };

  return (
    <div className="relative group rounded-3xl p-6 bg-gradient-to-b from-[#0B1D28]/90 to-[#05111B]/95 border border-emerald-500/20 hover:border-emerald-500/50 transition-all duration-500 shadow-2xl hover:shadow-emerald-950/40 backdrop-blur-xl">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
            🏦
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Avalanche Builders Pool</h4>
            <p className="text-xs text-zinc-400">Weekly community funding batch</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          Active Round
        </span>
      </div>

      {/* Progress Stats */}
      <div className="my-5 p-4 rounded-2xl bg-[#040D18]/80 border border-zinc-800/80">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-2xl font-black text-white">{currentTotal.toLocaleString()}</span>
            <span className="text-xs text-emerald-400 font-semibold ml-1.5">AVAX</span>
          </div>
          <span className="text-xs text-zinc-400">Target: {target.toLocaleString()} AVAX</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-zinc-800/80 overflow-hidden relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-[11px] text-zinc-500">
          <span>{percentage}% funded</span>
          <span>Closes in 2d 14h</span>
        </div>
      </div>

      {/* Interactive Contributor Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-zinc-400">Simulate Deposit</span>
          <span className="text-emerald-300 font-bold">{pledgeAmount} AVAX (~${(pledgeAmount * 34).toFixed(0)})</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={pledgeAmount}
          onChange={handlePledge}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      {/* Contributors Avatars */}
      <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center -space-x-2">
          {["🧑‍💻", "👩‍🚀", "🧙‍♂️", "⚡"].map((avatar, i) => (
            <div
              key={i}
              className="w-7 h-7 rounded-full bg-[#0A2E22] border-2 border-[#05111B] flex items-center justify-center text-xs shadow"
            >
              {avatar}
            </div>
          ))}
          <span className="pl-3 text-[11px] text-zinc-400 font-medium">+142 on-chain backers</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">0x43113...fuji</span>
      </div>
    </div>
  );
}

export function InteractiveChatCard() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "Alice.avax", text: "Approved the 100 AVAX grant proposal!", time: "10:42 AM", verified: true },
    { id: 2, sender: "Bob.avax", text: "Batch hash anchored on Fuji block #38912", time: "10:43 AM", verified: true },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "You",
      text: inputText,
      time: "Just now",
      verified: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    // Trigger Anime.js bounce on the new message
    setTimeout(() => {
      anime({
        targets: ".chat-msg-new",
        translateY: [10, 0],
        opacity: [0, 1],
        duration: 400,
        easing: "easeOutCubic",
      });
    }, 50);
  };

  return (
    <div className="relative group rounded-3xl p-6 bg-gradient-to-b from-[#0D1C24]/90 to-[#061017]/95 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-500 shadow-2xl hover:shadow-cyan-950/40 backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl">
            💬
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Zero-Gas Messenger</h4>
            <p className="text-xs text-zinc-400">Cryptographically anchored</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Realtime
        </div>
      </div>

      {/* Message Feed */}
      <div className="space-y-2.5 my-4 max-h-[160px] overflow-y-auto pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-3 rounded-2xl text-xs flex flex-col gap-1 ${
              m.sender === "You"
                ? "chat-msg-new bg-cyan-950/60 border border-cyan-500/30 ml-6 text-cyan-100"
                : "bg-[#040D18]/90 border border-zinc-800/80 mr-6 text-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="font-bold text-white">{m.sender}</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span>✓ On-Chain Hash</span>
                <span>{m.time}</span>
              </span>
            </div>
            <p className="leading-relaxed">{m.text}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="relative mt-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Try typing a test message..."
          className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-[#040D18] border border-zinc-800 focus:border-cyan-500 text-xs text-white placeholder-zinc-500 outline-none transition-all"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 text-[11px] font-bold text-white hover:opacity-90 active:scale-95 transition-all"
        >
          Anchor
        </button>
      </form>
    </div>
  );
}

export function InteractiveLuckyDrawCard() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [seed, setSeed] = useState("0x7F2a...98e4");

  const rollDraw = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    anime({
      targets: ".lottery-dice",
      rotate: "+=720deg",
      scale: [1, 1.25, 1],
      duration: 1200,
      easing: "easeInOutQuad",
      complete: () => {
        setIsSpinning(false);
        const candidates = ["0x889...2A1b", "0x34C...F819", "0x9E1...532c", "0x12F...7A89"];
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        setWinner(chosen);
        setSeed(`0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`);
      },
    });
  };

  return (
    <div className="relative group rounded-3xl p-6 bg-gradient-to-b from-[#181124]/90 to-[#0A0713]/95 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-500 shadow-2xl hover:shadow-purple-950/40 backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="lottery-dice w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl cursor-pointer">
            🎲
          </div>
          <div>
            <h4 className="font-bold text-white text-base">Verifiable Lucky Draw</h4>
            <p className="text-xs text-zinc-400">Provable on-chain randomness</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 rounded-full">
          VRF Seeded
        </span>
      </div>

      {/* Center Display */}
      <div className="my-5 p-4 rounded-2xl bg-[#040D18]/80 border border-zinc-800/80 text-center">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Prize Pool Payout</p>
        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 mt-1">
          2,500 AVAX
        </p>
        <div className="mt-3 p-2 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-between text-xs">
          <span className="text-zinc-400">Entropy Seed:</span>
          <span className="font-mono text-purple-300 font-semibold">{seed}</span>
        </div>
      </div>

      {/* Result / Action */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-[11px] text-zinc-500">Selected Winner:</p>
          <p className="text-sm font-mono font-bold text-emerald-400">
            {winner ? `🎉 ${winner}` : "Awaiting VRF Roll"}
          </p>
        </div>
        <button
          onClick={rollDraw}
          disabled={isSpinning}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSpinning ? "Computing..." : "Test VRF Roll ⚡"}
        </button>
      </div>
    </div>
  );
}

