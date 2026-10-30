"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
});

interface SplineHeroProps {
  sceneUrl?: string;
  className?: string;
}

const DEFAULT_SCENE = "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode";

function checkCapability(): boolean {
  if (typeof window === "undefined") return false;
  const isMobile = window.innerWidth < 768;
  const isLowEnd = typeof navigator !== "undefined" && navigator.hardwareConcurrency <= 2;

  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return false;
  } catch {
    return false;
  }

  return !isMobile && !isLowEnd;
}

export default function SplineHero({
  sceneUrl = DEFAULT_SCENE,
  className = "",
}: SplineHeroProps) {
  const [canRender, setCanRender] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const capable = checkCapability();
    setCanRender(capable);

    if (capable) {
      timeoutRef.current = setTimeout(() => {
        setIsLoaded((loaded) => {
          if (!loaded) setHasError(true);
          return loaded;
        });
      }, 7000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleLoad() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsLoaded(true);
  }

  return (
    <div className={`relative w-full max-w-4xl mx-auto h-[380px] sm:h-[460px] md:h-[520px] rounded-3xl overflow-hidden ${className}`}>
      {/* Background ambient mesh */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-[#0A2E22]/30 to-transparent pointer-events-none" />

      {/* Fallback & Loading Visual */}
      {(!isLoaded || hasError || !canRender) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 transition-opacity duration-700">
          <div className="relative">
            <div
              className="w-36 h-36 md:w-48 md:h-48 rounded-[36px] flex items-center justify-center shadow-2xl relative z-10"
              style={{
                background: "linear-gradient(135deg, #0A2E22 0%, #0F3828 40%, rgba(22,163,74,0.18) 100%)",
                border: "1px solid rgba(22,163,74,0.35)",
                boxShadow: "0 0 70px rgba(22,163,74,0.25), 0 30px 60px rgba(0,0,0,0.6)",
              }}
            >
              <img
                src="/logo.png"
                alt="FundChain 3D"
                className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-2xl animate-pulse"
              />
            </div>
            <div
              className="absolute inset-0 rounded-[36px] opacity-40 blur-2xl"
              style={{ background: "linear-gradient(135deg, #16A34A, #6EE7B7)" }}
            />
          </div>

          {!hasError && canRender && !isLoaded && (
            <div className="mt-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#081711]/80 border border-emerald-500/20 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Initializing Web3 3D Spatial Canvas...
            </div>
          )}

          {(!canRender || hasError) && (
            <div className="mt-4 text-xs text-zinc-400 max-w-sm">
              <span className="text-emerald-400 font-semibold">Avalanche High-Yield Engine</span> · Interactive hardware acceleration enabled for desktop
            </div>
          )}
        </div>
      )}

      {/* Interactive 3D Spline scene */}
      {canRender && !hasError && (
        <div
          className={`w-full h-full transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <Spline
            scene={sceneUrl}
            onLoad={handleLoad}
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      )}

      {/* Floating 3D Interaction Badge */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#040D18]/80 backdrop-blur-md border border-emerald-500/20 text-[11px] text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Interactive 3D Engine</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#040D18]/80 backdrop-blur-md border border-emerald-500/20 text-[11px] text-zinc-400">
          <span>Click & Drag to Orbit 3D</span>
        </div>
      </div>
    </div>
  );
}

