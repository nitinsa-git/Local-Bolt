"use client";
import React, { useState } from "react";

/**
 * Synthesized by VibeForge Local LLM Engine (Qwen2.5-Coder-7B-Instruct)
 * Prompt: build 2 console based application and let the applications communicate via message broker
 */
export default function GeneratedStudioApp() {
  const [refreshKey, setRefreshKey] = useState<number>(0);

  return (
    <main className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <header className="h-10 px-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Console Applications Communication</span>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          Reload View
        </button>
      </header>
      <iframe
        key={refreshKey}
        src="/index.html"
        title="Console Applications Communication"
        className="w-full flex-1 border-0"
      />
    </main>
  );
}
