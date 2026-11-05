"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Check,
  ChevronDown,
  Code2,
  Columns,
  Cpu,
  FileCode2,
  FileDown,
  FolderGit2,
  FolderPlus,
  Layers,
  ListChecks,
  Maximize2,
  MessageSquare,
  Moon,
  Palette,
  PanelLeftOpen,
  Search,
  Sparkles,
  Sun,
  Terminal,
  TerminalSquare,
  Wand2,
} from "lucide-react";
import { AgentConsole } from "@/components/agent-console";
import { MonacoEditorPane } from "@/components/monaco-editor";
import { PreviewViewport } from "@/components/preview-viewport";
import { ContainerGovernanceDrawer } from "@/components/container-governance-drawer";
import { CommandPaletteModal } from "@/components/command-palette";
import { VibeForgeLogo } from "@/components/vibeforge-logo";
import {
  GitExportModal,
  LLMSkillsModal,
  WorkspaceManagerModal,
} from "@/components/workspace-git-modals";
import {
  BACKEND_HTTP,
  STUDIO_THEMES,
  ThemeTone,
  WorkbenchMode,
  useStudioStore,
} from "@/lib/store";

const WORKBENCH_MODES: {
  id: WorkbenchMode;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
}[] = [
  {
    id: "split",
    label: "Split Studio",
    shortLabel: "Split",
    icon: Columns,
    hint: "Agent Chat + Live Preview",
  },
  {
    id: "ide",
    label: "Code + Preview",
    shortLabel: "IDE",
    icon: Layers,
    hint: "Agent + Monaco Editor + Live Preview",
  },
  {
    id: "code",
    label: "Code Focus",
    shortLabel: "Code",
    icon: Code2,
    hint: "Agent + Full-Width Monaco Code Editor",
  },
  {
    id: "cinema",
    label: "Preview Cinema",
    shortLabel: "Cinema",
    icon: Maximize2,
    hint: "Collapsed Activity Rail + Full-Canvas Live Preview",
  },
];

export default function StudioPage() {
  const {
    projectId,
    workspaces,
    files,
    steps,
    selectedSkills,
    themeTone,
    setThemeTone,
    workbenchMode,
    setWorkbenchMode,
    agentCollapsed,
    setAgentCollapsed,
    showEditor,
    showPreviewConsole,
    setShowPreviewConsole,
    showWorkspaceFiles,
    setShowWorkspaceFiles,
    showSteppedProgress,
    setShowSteppedProgress,
    showSandboxShell,
    setShowSandboxShell,
    setProjectId,
    setPreviewUrl,
    setWorkspaces,
    setGovernanceOpen,
    setWorkspaceModalOpen,
    setGitModalOpen,
    setSkillsModalOpen,
    setCommandPaletteOpen,
    setFiles,
    appendConsoleLog,
  } = useStudioStore();

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const handleDownloadBlueprint = async () => {
    const activePid = projectId || "default";
    try {
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${activePid}/blueprint`
      );
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
        `[Blueprint] Exported & downloaded ${filename} (${data.version || "v1.1"}) for workspace '${activePid}'`
      );
      const filesRes = await fetch(
        `${BACKEND_HTTP}/api/projects/${activePid}/files`
      );
      if (filesRes.ok) {
        setFiles(await filesRes.json());
      }
    } catch (e) {
      console.warn("Failed to download Blueprint.md:", e);
    }
  };

  useEffect(() => {
    setPreviewUrl(`/api/projects/${projectId}/preview`);
    try {
      const saved = window.localStorage.getItem(
        "local-dev-studio-theme"
      ) as ThemeTone | null;
      if (saved && STUDIO_THEMES.some((t) => t.id === saved)) {
        setThemeTone(saved);
      } else {
        document.documentElement.setAttribute("data-theme", themeTone);
      }
    } catch {
      document.documentElement.setAttribute("data-theme", themeTone);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeTone);
  }, [themeTone]);

  useEffect(() => {
    fetch(`${BACKEND_HTTP}/api/workspaces`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setWorkspaces(data);
      })
      .catch(() => {});
  }, [projectId, setWorkspaces]);

  const activeThemeMeta =
    STUDIO_THEMES.find((t) => t.id === themeTone) || STUDIO_THEMES[0];
  const isLightMode = activeThemeMeta.mode === "light";

  const quickToggleLightDark = () => {
    if (isLightMode) {
      setThemeTone("nextgen-spatial");
    } else {
      setThemeTone("alabaster-light");
    }
  };

  const showPreviewPane = workbenchMode !== "code";

  return (
    <div
      data-theme={themeTone}
      onClick={() => {
        if (themeMenuOpen) setThemeMenuOpen(false);
      }}
      className="studio-spotlight-canvas flex flex-col h-screen w-screen p-2 gap-2 overflow-hidden select-none"
    >
      {/* Top NextGen Spatial Command Ribbon */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="bento-glass nextgen-ribbon rounded-2xl h-13 px-3.5 py-2 flex items-center justify-between gap-3 shrink-0 z-20"
      >
        {/* Left: Local Bolt / VibeForge Brand + NextGen UI Badge + Breadcrumb Workspace Selector + ⌘K */}
        <div className="flex items-center gap-2.5 shrink-0">
          <motion.div
            whileHover={{ rotate: 6, scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0"
          >
            <VibeForgeLogo className="w-8 h-8 rounded-xl shadow-sm shadow-cyan-500/20" />
          </motion.div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="font-display text-sm font-extrabold tracking-[-0.03em] whitespace-nowrap text-slate-100">
                  Local Bolt
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/35 text-[9px] font-mono font-semibold uppercase tracking-wider text-cyan-200 tabular-nums">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                  NextGen UI
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 leading-none hidden sm:inline">
                VibeForge Spatial AI Studio
              </span>
            </div>
          </div>

          <span className="text-slate-700 font-mono text-xs hidden md:inline">/</span>

          {/* Active Workspace Switcher Pill */}
          <div className="relative flex items-center shrink-0">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="appearance-none text-xs font-mono font-semibold pl-3 pr-7 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-slate-100 border border-white/[0.09] hover:border-cyan-400/40 cursor-pointer focus:outline-none focus:border-cyan-400/60 transition whitespace-nowrap tabular-nums"
              title="Switch Active Workspace"
            >
              {workspaces.length === 0 ? (
                <option value={projectId}>ws://{projectId}</option>
              ) : (
                workspaces.map((ws) => (
                  <option key={ws.project_id} value={ws.project_id}>
                    ws://{ws.project_id} ({ws.file_count} files)
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-5" />
          </div>

          {/* Command Palette Trigger (⌘K Omnibar) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden xl:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/75 hover:bg-slate-900 border border-white/[0.08] hover:border-cyan-400/40 text-xs text-slate-400 hover:text-slate-100 transition"
            title="Open NextGen Command Palette (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px]">Omnibar...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.08] text-[10px] font-mono text-slate-300">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Center: NextGen Tubelight Segmented Workbench Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl nextgen-tubelight shrink-0">
          {WORKBENCH_MODES.map((m) => {
            const Icon = m.icon;
            const active = workbenchMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setWorkbenchMode(m.id)}
                title={`${m.label} — ${m.hint}`}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nextgen-workbench-tubelight"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/20 via-indigo-500/25 to-violet-500/20 border border-cyan-400/40 shadow-sm"
                  >
                    <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-7 h-[2px] rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee]" />
                  </motion.div>
                )}
                <Icon
                  className={`w-3.5 h-3.5 relative z-10 ${
                    active ? "text-cyan-300" : "text-slate-400"
                  }`}
                />
                <span className="relative z-10 hidden md:inline">{m.label}</span>
                <span className="relative z-10 md:hidden">{m.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Studio Action Cluster + Theme Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSkillsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-indigo-500/20 hover:from-cyan-500/25 hover:to-indigo-500/30 border border-cyan-400/35 text-xs font-semibold text-cyan-100 transition whitespace-nowrap tabular-nums"
            title="Manage LLM & NextGen UI Skills"
          >
            <Wand2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Skills ({selectedSkills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] hover:border-indigo-400/40 text-xs font-semibold text-slate-200 transition whitespace-nowrap"
            title="New or Load Workspace"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Workspaces</span>
          </button>

          <button
            type="button"
            onClick={() => setGitModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] hover:border-emerald-400/40 text-xs font-semibold text-slate-200 transition whitespace-nowrap"
            title="Export to Git"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Git</span>
          </button>

          <button
            type="button"
            onClick={() => setGovernanceOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] hover:border-cyan-400/40 text-xs font-semibold text-slate-200 transition whitespace-nowrap"
            title="Core Governance & CuriousLLM Higher-LLM Engine"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Governance</span>
          </button>

          {/* Theme Tone Selector */}
          <div
            className="relative flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center rounded-xl bg-slate-950/80 border border-white/[0.08] p-0.5">
              <button
                type="button"
                onClick={quickToggleLightDark}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/60 transition"
                title={`Switch to ${isLightMode ? "Dark" : "Light"} Theme`}
              >
                {isLightMode ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span className="hidden 2xl:inline">{activeThemeMeta.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="px-1.5 py-1 rounded-lg text-slate-400 hover:text-slate-100 border-l border-slate-800 transition flex items-center gap-0.5"
                title="Select Studio Theme Tone"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <AnimatePresence>
              {themeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-11 w-64 bento-glass rounded-2xl p-2 z-50 shadow-2xl space-y-1"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Theme Tone
                  </div>
                  {STUDIO_THEMES.map((t) => {
                    const active = themeTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setThemeTone(t.id);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition ${
                          active
                            ? "bg-cyan-500/15 border-cyan-400/40 text-slate-100"
                            : "bg-transparent border-transparent hover:bg-slate-900 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-5 h-5 rounded-md border border-slate-700 flex items-center justify-center shrink-0"
                            style={{ backgroundColor: t.swatchBg }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: t.swatchAccent }}
                            />
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {t.mode} tone
                            </div>
                          </div>
                        </div>
                        {active && (
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Main Dynamic Workbench Canvas */}
      <main className="flex-1 flex gap-2 min-h-0 overflow-hidden z-10">
        {/* Left Panel: Collapsible Activity Rail OR Full Agent Console */}
        {agentCollapsed ? (
          <motion.aside
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-12 shrink-0 h-full rounded-2xl nextgen-rail flex flex-col items-center justify-between py-3 z-10"
          >
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAgentCollapsed(false);
                  if (workbenchMode === "cinema") {
                    setWorkbenchMode("split");
                  }
                }}
                className="w-8 h-8 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/35 flex items-center justify-center text-cyan-300 transition"
                title="Expand Agent Console"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>

              <div className="w-5 h-[1px] bg-white/[0.08] my-0.5" />

              <button
                type="button"
                onClick={() => setAgentCollapsed(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white transition"
                title="Open Agent Chat"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAgentCollapsed(false);
                  setShowWorkspaceFiles(true);
                }}
                className="relative w-8 h-8 rounded-xl hover:bg-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white transition"
                title={`Workspace Files (${files.length})`}
              >
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <span className="absolute -top-1 -right-1 px-1 rounded-full bg-slate-900 border border-white/15 text-[8px] font-mono text-cyan-300 tabular-nums">
                  {files.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAgentCollapsed(false);
                  setShowSteppedProgress(true);
                }}
                className="relative w-8 h-8 rounded-xl hover:bg-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white transition"
                title={`Stepped Agent Progress (${steps.length})`}
              >
                <ListChecks className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setAgentCollapsed(false);
                  setShowSandboxShell(true);
                }}
                className="w-8 h-8 rounded-xl hover:bg-slate-800/80 flex items-center justify-center text-slate-300 hover:text-white transition"
                title="Open Interactive Sandbox Shell"
              >
                <Terminal className="w-4 h-4 text-amber-400" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setSkillsModalOpen(true)}
                className="w-8 h-8 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 flex items-center justify-center text-indigo-300 transition"
                title={`Active Skills (${selectedSkills.length})`}
              >
                <Wand2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setGovernanceOpen(true)}
                className="w-8 h-8 rounded-xl hover:bg-slate-800/80 flex items-center justify-center text-cyan-400 transition"
                title="CuriousLLM Core Governance"
              >
                <Brain className="w-4 h-4" />
              </button>
            </div>
          </motion.aside>
        ) : (
          <AgentConsole />
        )}

        {/* Center Panel: Monaco Code Editor */}
        <AnimatePresence initial={false}>
          {showEditor && (
            <motion.div
              key="monaco-editor-pane"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="flex-1 flex min-w-0 h-full bento-glass rounded-2xl overflow-hidden"
            >
              <MonacoEditorPane />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel: Live Preview Viewport (hidden only in Code Focus mode) */}
        {showPreviewPane && <PreviewViewport />}
      </main>

      {/* Bottom NextGen IDE Telemetry Status Bar */}
      <footer className="nextgen-status-bar h-7 rounded-xl px-3 flex items-center justify-between gap-3 text-[11px] font-mono text-slate-400 shrink-0 z-20">
        {/* Left Telemetry Cluster */}
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sandbox Ready • hybrid_isolated
          </span>

          <span className="text-slate-700">|</span>

          <button
            type="button"
            onClick={() => setWorkspaceModalOpen(true)}
            className="hover:text-cyan-300 transition truncate"
            title="Switch or Create Workspace"
          >
            ws://{projectId} ({files.length} files)
          </button>

          <span className="text-slate-700 hidden md:inline">|</span>

          <span className="hidden md:inline-flex items-center gap-1 text-slate-300">
            Mode:{" "}
            <strong className="text-cyan-300 uppercase">{workbenchMode}</strong>
          </span>
        </div>

        {/* Right Telemetry Cluster */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setGovernanceOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-400/25 text-cyan-200 transition"
            title="Configure Core CuriousLLM Higher-LLM Reasoning Engine"
          >
            <Brain className="w-3 h-3 text-cyan-300" />
            <span>CuriousLLM v1.0 • Multi-Hop</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadBlueprint}
            className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 transition"
            title="Download Workspace Blueprint.md"
          >
            <FileDown className="w-3 h-3 text-indigo-300" />
            <span>Blueprint.md</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (agentCollapsed) setAgentCollapsed(false);
              setShowSandboxShell(!showSandboxShell);
            }}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border transition ${
              showSandboxShell
                ? "bg-amber-500/20 border-amber-400/40 text-amber-200"
                : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle Interactive Sandbox Shell"
          >
            <Terminal className="w-3 h-3" />
            <span>Shell</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreviewConsole(!showPreviewConsole)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border transition ${
              showPreviewConsole
                ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200"
                : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle Live Preview Runtime Console"
          >
            <TerminalSquare className="w-3 h-3" />
            <span>Console</span>
          </button>
        </div>
      </footer>

      {/* Drawers & Modals */}
      <ContainerGovernanceDrawer />
      <WorkspaceManagerModal />
      <LLMSkillsModal />
      <GitExportModal />
      <CommandPaletteModal />
    </div>
  );
}
