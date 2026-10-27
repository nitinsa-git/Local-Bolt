"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Code2,
  Compass,
  ExternalLink,
  Laptop,
  MessageSquareCode,
  PanelBottom,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Rocket,
  Smartphone,
  Tablet,
  TerminalSquare,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { BACKEND_HTTP, useStudioStore } from "@/lib/store";

type ViewportMode = "desktop" | "tablet" | "mobile";

export function PreviewViewport() {
  const {
    projectId,
    previewUrl,
    previewRefreshKey,
    bumpPreviewRefresh,
    consoleLogs,
    clearConsoleLogs,
    appendConsoleLog,
    setFiles,
    showEditor,
    setShowEditor,
    showPreviewConsole,
    setShowPreviewConsole,
    isRunningAgent,
  } = useStudioStore();

  const activePid = projectId || "default";
  const standaloneAppUrl = `${BACKEND_HTTP}/apps/${activePid}`;
  const blueprintApiUrl = `${BACKEND_HTTP}/api/projects/${activePid}/blueprint`;
  const promptsApiUrl = `${BACKEND_HTTP}/api/projects/${activePid}/prompts`;

  const handleDownloadPrompts = async () => {
    try {
      const res = await fetch(promptsApiUrl);
      if (!res.ok) return;
      const data = await res.json();
      const filename = data.filename || `${activePid}-Prompts-v1.1.md`;
      const blob = new Blob([data.content || ""], {
        type: "text/markdown;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      appendConsoleLog(
        `[Prompts] Downloaded ${filename} (${data.version || "v1.1"}) for workspace '${activePid}'`
      );
      const filesRes = await fetch(`${BACKEND_HTTP}/api/projects/${activePid}/files`);
      if (filesRes.ok) {
        setFiles(await filesRes.json());
      }
    } catch (e) {
      console.warn("Failed to download Prompts.md:", e);
    }
  };

  const handleDownloadBlueprint = async () => {
    try {
      const res = await fetch(blueprintApiUrl);
      if (!res.ok) return;
      const data = await res.json();
      const filename = data.filename || `${activePid}-Blueprint-v1.1.md`;
      const blob = new Blob([data.content || ""], {
        type: "text/markdown;charset=utf-8",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      appendConsoleLog(
        `[Blueprint] Downloaded ${filename} (${data.version || "v1.1"}) for workspace '${activePid}'`
      );
      const filesRes = await fetch(`${BACKEND_HTTP}/api/projects/${activePid}/files`);
      if (filesRes.ok) {
        setFiles(await filesRes.json());
      }
    } catch (e) {
      console.warn("Failed to download Blueprint.md:", e);
    }
  };

  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [showAiRuntimeInfo, setShowAiRuntimeInfo] = useState(false);
  const [tasteDv, setTasteDv] = useState<number>(6);
  const [tasteMi, setTasteMi] = useState<number>(6);
  const [tasteVd, setTasteVd] = useState<number>(5);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const syncTasteDialsToPreview = (dv: number, mi: number, vd: number) => {
    setTasteDv(dv);
    setTasteMi(mi);
    setTasteVd(vd);
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "VIBEFORGE_TASTE_DIALS", dv, mi, vd },
        "*"
      );
      appendConsoleLog(
        `[TasteSkill V2] Applied Dials -> DESIGN_VARIANCE=${dv}/10, MOTION_INTENSITY=${mi}/10, VISUAL_DENSITY=${vd}/10`
      );
    } catch {
      // ignore cross-origin postMessage errors
    }
  };

  const viewportWidth =
    viewport === "mobile"
      ? "w-[375px]"
      : viewport === "tablet"
      ? "w-[768px]"
      : "w-full";

  const viewportDimensionLabel =
    viewport === "mobile"
      ? "375px"
      : viewport === "tablet"
      ? "768px"
      : "100% Fluid";

  return (
    <motion.section
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`${
        showEditor ? "w-[480px] xl:w-[560px] shrink-0" : "flex-1 min-w-0"
      } flex flex-col bento-glass rounded-2xl overflow-hidden h-full`}
    >
      {/* Top 21st.dev Interactive Browser Chrome Toolbar */}
      <div className="relative z-30 h-11 px-3.5 border-b border-white/[0.08] bg-slate-950/85 flex items-center justify-between gap-2.5 shrink-0">
        {/* Left: macOS Traffic Lights + Toggle Editor Icon + Device Viewport Toggles */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300/50 shadow-sm shadow-rose-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300/50 shadow-sm shadow-amber-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300/50 shadow-sm shadow-emerald-500/40" />
          </div>

          <motion.button
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowEditor(!showEditor)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition ${
              showEditor
                ? "bg-indigo-600/25 text-indigo-200 border-indigo-400/50 shadow-sm shadow-indigo-500/20"
                : "bg-slate-950/90 text-slate-200 border-slate-700/80 hover:border-indigo-400/50 hover:text-white"
            }`}
            title={
              showEditor
                ? "Hide Code Editor (Expand Preview)"
                : "Show Code Editor"
            }
          >
            {showEditor ? (
              <PanelLeftClose className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <Code2 className="w-3.5 h-3.5" />
          </motion.button>

          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-700/80">
            {(
              [
                { mode: "desktop", icon: Laptop, title: "Desktop Viewport" },
                { mode: "tablet", icon: Tablet, title: "Tablet Viewport" },
                { mode: "mobile", icon: Smartphone, title: "Mobile Viewport" },
              ] as const
            ).map(({ mode, icon: Icon, title }) => (
              <motion.button
                key={mode}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setViewport(mode)}
                className={`relative p-1 rounded-lg transition ${
                  viewport === mode
                    ? "!text-white"
                    : "text-slate-300 hover:text-white"
                }`}
                title={title}
              >
                {viewport === mode && (
                  <motion.span
                    layoutId="preview-device-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 -z-10 shadow-sm shadow-indigo-500/30"
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
              </motion.button>
            ))}
          </div>

          <span className="hidden xl:inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 leading-none rounded-md bg-indigo-500/15 border border-indigo-400/35 text-indigo-200">
            {viewportDimensionLabel}
          </span>
        </div>

        {/* Center: Live Preview URL Bar with Active Pulse */}
        <div className="flex-1 flex items-center justify-between gap-2 truncate px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-700/80 text-[11px] font-mono text-slate-100">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isRunningAgent
                  ? "bg-amber-400 animate-ping"
                  : "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400"
              }`}
            />
            <span className="truncate">{previewUrl}</span>
          </div>
          <span className="hidden md:inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 leading-none rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0 shadow-sm shadow-emerald-500/10">
            {isRunningAgent ? "Synthesizing" : "Live"}
          </span>
        </div>

        {/* Right: Toggle Preview Console Icon + Reload + Open External */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowPreviewConsole(!showPreviewConsole)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-semibold transition ${
              showPreviewConsole
                ? "bg-emerald-600/25 text-emerald-200 border-emerald-400/50"
                : "bg-slate-950/90 text-slate-200 border-slate-700/80 hover:border-emerald-400/50 hover:text-white"
            }`}
            title={
              showPreviewConsole
                ? "Hide Preview Console Drawer"
                : "Show Preview Console Drawer"
            }
          >
            <PanelBottom className="w-3.5 h-3.5 text-emerald-400" />
            <TerminalSquare className="w-3.5 h-3.5" />
          </motion.button>

          <motion.button
            whileHover={{ rotate: 90, scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={bumpPreviewRefresh}
            className="p-1.5 rounded-lg bg-slate-950/90 hover:bg-indigo-950/60 text-slate-200 hover:text-white border border-slate-700/80 hover:border-indigo-400/50 transition"
            title="Reload Live Preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </motion.button>
          {/* 0. AI • RAG • SQLite • MCP Compact Info Icon Button with Tooltip */}
          <div className="relative group">
            <motion.button
              whileHover={{ y: -1, scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setShowAiRuntimeInfo((prev) => !prev)}
              aria-label={`AI • RAG • SQLite • MCP Runtime (${activePid})`}
              title={`⚡ AI • RAG • SQLite • MCP Runtime (${activePid})`}
              className={`p-1.5 rounded-lg border transition flex items-center justify-center ${
                showAiRuntimeInfo
                  ? "bg-violet-600/35 text-white border-violet-400/70 shadow-sm shadow-violet-500/30"
                  : "bg-violet-500/20 hover:bg-violet-500/35 text-violet-300 hover:text-white border-violet-400/50"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
            </motion.button>
            <span className="pointer-events-none absolute right-0 top-full mt-1.5 z-50 whitespace-nowrap rounded-lg bg-slate-950/95 border border-violet-500/40 px-2.5 py-1 text-[10px] font-semibold text-violet-200 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              ⚡ AI &bull; RAG &bull; SQLite &bull; MCP ({activePid})
            </span>

            {showAiRuntimeInfo && (
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl bg-slate-950/95 border border-violet-500/40 p-3 shadow-2xl text-[11px] text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-violet-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI &bull; RAG &bull; SQLite &bull; MCP</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiRuntimeInfo(false)}
                    className="text-slate-400 hover:text-white p-0.5"
                    aria-label="Close Runtime Info"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 text-[10px] text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Workspace:</span>
                    <span className="font-mono font-semibold text-indigo-300">{activePid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">In-App SDK:</span>
                    <code className="text-emerald-300 bg-slate-900 px-1.5 py-0.5 rounded">window.VibeForgeSDK</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">SQLite Store:</span>
                    <code className="text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded">workspace.db</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Capabilities:</span>
                    <span className="text-fuchsia-300 font-semibold">LLM Chat, RAG, SQL, MCP</span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      TasteSkill V2 3-Dial Engine
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                      DV={tasteDv} MI={tasteMi} VD={tasteVd}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        { label: "Minimal", dv: 6, mi: 3, vd: 3 },
                        { label: "Soft", dv: 5, mi: 6, vd: 3 },
                        { label: "Bento", dv: 8, mi: 7, vd: 5 },
                        { label: "Dense", dv: 3, mi: 4, vd: 8 },
                      ] as const
                    ).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => syncTasteDialsToPreview(p.dv, p.mi, p.vd)}
                        className="px-1.5 py-1 rounded bg-slate-900 hover:bg-indigo-600/25 border border-white/[0.08] hover:border-indigo-400/50 text-[9px] font-semibold text-slate-300 hover:text-white transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    <label className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">DESIGN_VARIANCE</span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={tasteDv}
                        onChange={(e) =>
                          syncTasteDialsToPreview(
                            Number(e.target.value),
                            tasteMi,
                            tasteVd
                          )
                        }
                        className="w-24 accent-violet-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">MOTION_INTENSITY</span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={tasteMi}
                        onChange={(e) =>
                          syncTasteDialsToPreview(
                            tasteDv,
                            Number(e.target.value),
                            tasteVd
                          )
                        }
                        className="w-24 accent-indigo-500 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">VISUAL_DENSITY</span>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={tasteVd}
                        onChange={(e) =>
                          syncTasteDialsToPreview(
                            tasteDv,
                            tasteMi,
                            Number(e.target.value)
                          )
                        }
                        className="w-24 accent-emerald-500 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 1. Prompts.md Icon Button with Tooltip */}
          <div className="relative group">
            <motion.button
              whileHover={{ y: -1, scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleDownloadPrompts}
              aria-label="Download Prompts.md (Chain-of-Thought & Next Steps)"
              title={`Download Prompts.md (${activePid} — Chain-of-Thought & Recommended Next Steps)`}
              className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 hover:text-white border border-indigo-400/50 transition flex items-center justify-center"
            >
              <MessageSquareCode className="w-3.5 h-3.5" />
            </motion.button>
            <span className="pointer-events-none absolute right-0 top-full mt-1.5 z-50 whitespace-nowrap rounded-lg bg-slate-950/95 border border-indigo-500/40 px-2.5 py-1 text-[10px] font-semibold text-indigo-200 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              Download Prompts.md (CoT &amp; Next Steps)
            </span>
          </div>

          {/* 2. Blueprint.md Icon Button with Tooltip */}
          <div className="relative group">
            <motion.button
              whileHover={{ y: -1, scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={handleDownloadBlueprint}
              aria-label="Download Blueprint.md (Application Architecture Spec)"
              title={`Download Blueprint.md (${activePid} — Full Application Blueprint for Claude / Antigravity)`}
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 hover:text-white border border-emerald-400/50 transition flex items-center justify-center"
            >
              <Compass className="w-3.5 h-3.5" />
            </motion.button>
            <span className="pointer-events-none absolute right-0 top-full mt-1.5 z-50 whitespace-nowrap rounded-lg bg-slate-950/95 border border-emerald-500/40 px-2.5 py-1 text-[10px] font-semibold text-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              Download Blueprint.md (App Architecture Spec)
            </span>
          </div>

          {/* 3. Publish App Icon Button with Tooltip */}
          <div className="relative group">
            <a
              href={standaloneAppUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Publish & Open Standalone App"
              title={`Publish & Open Standalone App (/apps/${activePid})`}
              className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-600/30 to-fuchsia-600/30 hover:from-indigo-600/50 hover:to-fuchsia-600/50 text-fuchsia-300 hover:text-white border border-fuchsia-400/50 transition flex items-center justify-center"
            >
              <Rocket className="w-3.5 h-3.5" />
            </a>
            <span className="pointer-events-none absolute right-0 top-full mt-1.5 z-50 whitespace-nowrap rounded-lg bg-slate-950/95 border border-fuchsia-500/40 px-2.5 py-1 text-[10px] font-semibold text-fuchsia-200 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
              Publish App (/apps/{activePid})
            </span>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-slate-950/90 hover:bg-indigo-950/60 text-slate-200 hover:text-white border border-slate-700/80 hover:border-indigo-400/50 transition"
            title="Open Preview in New Tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Iframe Container with Framer Motion Layout Spring */}
      <div className="flex-1 bg-slate-950/50 flex items-center justify-center overflow-hidden p-2 min-h-0">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className={`${viewportWidth} h-full bg-slate-950 rounded-xl overflow-hidden border border-indigo-500/25 shadow-2xl`}
        >
          <iframe
            ref={iframeRef}
            key={previewRefreshKey}
            src={`${previewUrl}?t=${previewRefreshKey}`}
            title="Live Container Preview"
            className="w-full h-full border-0 bg-slate-950"
          />
        </motion.div>
      </div>

      {/* Runtime Preview Console Output Drawer */}
      <AnimatePresence initial={false}>
        {showPreviewConsole && (
          <motion.div
            key="preview-console-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="border-t border-slate-800 bg-slate-950/95 flex flex-col shrink-0 overflow-hidden"
          >
            <div
              onClick={() => setShowPreviewConsole(false)}
              className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900/70 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <TerminalSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preview Console Drawer ({consoleLogs.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearConsoleLogs();
                  }}
                  className="text-slate-400 hover:text-rose-400 p-0.5"
                  title="Clear Console"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronDown className="w-4 h-4 text-slate-400 hover:text-slate-100" />
              </div>
            </div>

            <div className="h-36 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1 bg-slate-950 text-slate-300">
              {consoleLogs.map((line, i) => (
                <div
                  key={i}
                  className="border-b border-slate-900/80 pb-0.5 break-all"
                >
                  {line}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
