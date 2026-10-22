"use client";

import { useState } from "react";
import { copyToClipboard } from "@/lib/utils/clipboard";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs"
      title="Copy to clipboard"
    >
      {copied ? "✓ Copied" : "📋 Copy"}
    </button>
  );
}
