"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

export default function LiveMetricsBar() {
  const count1Ref = useRef<HTMLSpanElement>(null);
  const count2Ref = useRef<HTMLSpanElement>(null);
  const count3Ref = useRef<HTMLSpanElement>(null);
  const count4Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const obj = {
      val1: 0,
      val2: 0,
      val3: 0,
      val4: 0,
    };

    anime({
      targets: obj,
      val1: 1845000,
      val2: 43113,
      val3: 99.98,
      val4: 1.6,
      round: 1,
      easing: "easeOutExpo",
      duration: 2200,
      update: () => {
        if (count1Ref.current) {
          count1Ref.current.innerHTML = "$" + Math.round(obj.val1).toLocaleString();
        }
        if (count2Ref.current) {
          count2Ref.current.innerHTML = String(Math.round(obj.val2));
        }
        if (count3Ref.current) {
          count3Ref.current.innerHTML = obj.val3.toFixed(2) + "%";
        }
        if (count4Ref.current) {
          count4Ref.current.innerHTML = obj.val4.toFixed(1) + "s";
        }
      },
    });
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-6">
      <div className="relative rounded-3xl p-8 bg-gradient-to-r from-[#07131F]/90 via-[#0B2129]/90 to-[#07131F]/90 border border-emerald-500/20 backdrop-blur-2xl shadow-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80">
          <div className="text-center md:px-4 pt-4 md:pt-0">
            <span ref={count1Ref} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              $0
            </span>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mt-1.5 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Total Pooled Volume
            </p>
          </div>

          <div className="text-center md:px-4 pt-4 md:pt-0">
            <span ref={count2Ref} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              0
            </span>
            <p className="text-xs text-teal-300 font-semibold uppercase tracking-wider mt-1.5">
              Avalanche Fuji Chain ID
            </p>
          </div>

          <div className="text-center md:px-4 pt-4 md:pt-0">
            <span ref={count3Ref} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              0%
            </span>
            <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mt-1.5">
              Uptime Reliability
            </p>
          </div>

          <div className="text-center md:px-4 pt-4 md:pt-0">
            <span ref={count4Ref} className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              0s
            </span>
            <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider mt-1.5">
              Subnet Finality Speed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

