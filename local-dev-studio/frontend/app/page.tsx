"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  Code2,
  Cpu,
  FileDown,
  FolderGit2,
  FolderPlus,
  Moon,
  Palette,
  Search,
  Sun,
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
  useStudioStore,
} from "@/lib/store";

export default function StudioPage() {
  const {
    projectId,
    workspaces,
    selectedSkills,
    themeTone,
    setThemeTone,
    showEditor,
    setShowEditor,
    showPreviewConsole,
    setShowPreviewConsole,
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

  const handleDownloadPrompts = async () => {
    const activePid = projectId || "default";
    try {
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${activePid}/prompts`
      );
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
        `[Prompts] Exported & downloaded ${filename} (${data.version || "v1.1"}) for workspace '${activePid}'`
      );
      const filesRes = await fetch(
        `${BACKEND_HTTP}/api/projects/${activePid}/files`
      );
      if (filesRes.ok) {
        setFiles(await filesRes.json());
      }
    } catch (e) {
      console.warn("Failed to download Prompts.md:", e);
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
      setThemeTone("obsidian-dark");
    } else {
      setThemeTone("alabaster-light");
    }
  };

  return (
    <div
      data-theme={themeTone}
      onClick={() => {
        if (themeMenuOpen) setThemeMenuOpen(false);
      }}
      className="studio-spotlight-canvas flex flex-col h-screen w-screen p-2.5 gap-2.5 overflow-hidden select-none"
    >
      {/* Top Studio Header */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="bento-glass rounded-2xl h-14 px-4 flex items-center justify-between gap-4 shrink-0 z-20"
      >
        {/* Left: VibeForge Logo + Title + Active Workspace Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.div
            whileHover={{ rotate: 6, scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0"
          >
            <VibeForgeLogo className="w-8 h-8 rounded-xl shadow-sm shadow-indigo-500/15" />
          </motion.div>

          <div className="flex items-center gap-2 shrink-0">
            <h1 className="font-display text-sm font-extrabold tracking-[-0.03em] whitespace-nowrap text-slate-100">
              VibeForge
            </h1>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[9px] font-mono font-semibold uppercase tracking-wider text-indigo-300 tabular-nums">
              Taste V2
            </span>
          </div>

          {/* Active Workspace Switcher */}
          <div className="relative flex items-center shrink-0">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="appearance-none text-xs font-mono font-medium pl-3 pr-7 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-white/[0.08] cursor-pointer focus:outline-none focus:border-indigo-500/60 transition whitespace-nowrap tabular-nums"
              title="Switch Active Workspace"
            >
              {workspaces.length === 0 ? (
                <option value={projectId}>Workspace: {projectId}</option>
              ) : (
                workspaces.map((ws) => (
                  <option key={ws.project_id} value={ws.project_id}>
                    Workspace: {ws.project_id} ({ws.file_count} files)
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-5" />
          </div>

          {/* Command Palette Trigger (⌘K) */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden lg:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-950/75 hover:bg-slate-900 border border-white/[0.08] hover:border-indigo-500/40 text-xs text-slate-400 hover:text-slate-200 transition"
            title="Open Command Palette (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Command...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.08] text-[10px] font-mono text-slate-300">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Theme Switcher + View Toggles + Studio Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Lighter / Darker Theme Tone Selector */}
          <div
            className="relative flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center rounded-xl bg-slate-950/80 border border-white/[0.08] p-0.5">
              <button
                type="button"
                onClick={quickToggleLightDark}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/60 transition"
                title={`Switch to ${isLightMode ? "Dark" : "Light"} Theme`}
              >
                {isLightMode ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>{activeThemeMeta.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-100 border-l border-slate-800 transition flex items-center gap-1"
                title="Select Lighter or Darker Theme Tone"
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
                            ? "bg-indigo-600/15 border-indigo-500/40 text-slate-100"
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
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Editor & Console View Toggles */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-950/80 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowEditor(!showEditor)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                showEditor
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              title={showEditor ? "Hide Code Editor" : "Show Code Editor"}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewConsole(!showPreviewConsole)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                showPreviewConsole
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100"
              }`}
              title={
                showPreviewConsole
                  ? "Hide Preview Console"
                  : "Show Preview Console"
              }
            >
              <TerminalSquare className="w-3.5 h-3.5" />
              <span>Console</span>
            </button>
          </div>

          {/* Studio Action Modals */}
          <button
            type="button"
            onClick={() => setSkillsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/35 text-xs font-semibold text-indigo-100 transition whitespace-nowrap tabular-nums"
            title="Manage LLM Skills"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Skills ({selectedSkills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] hover:border-indigo-400/40 text-xs font-semibold text-slate-200 transition whitespace-nowrap"
            title="New or Load Workspace"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Workspaces</span>
          </button>

          <button
            type="button"
            onClick={() => setGitModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] hover:border-emerald-400/40 text-xs font-semibold text-slate-200 transition whitespace-nowrap"
            title="Export to Git"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Git Export</span>
          </button>

          <button
            type="button"
            onClick={() => setGovernanceOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/[0.08] hover:border-cyan-400/40 text-xs font-semibold text-slate-200 transition whitespace-nowrap"
            title="Container Governance"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Governance</span>
          </button>
        </div>
      </motion.header>

      {/* Main Studio Workspace */}
      <main className="flex-1 flex gap-2.5 min-h-0 overflow-hidden z-10">
        {/* Left Panel: Agent Console */}
        <AgentConsole />

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

        {/* Right Panel: Live Preview Viewport */}
        <PreviewViewport />
      </main>

      {/* Drawers & Modals */}
      <ContainerGovernanceDrawer />
      <WorkspaceManagerModal />
      <LLMSkillsModal />
      <GitExportModal />
      <CommandPaletteModal />
    </div>
  );
}
