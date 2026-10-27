"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Code2,
  Command,
  Cpu,
  FolderGit2,
  FolderPlus,
  FolderTree,
  ListChecks,
  Moon,
  Palette,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Terminal,
  TerminalSquare,
  Wand2,
  X,
} from "lucide-react";
import {
  BACKEND_HTTP,
  STUDIO_THEMES,
  ThemeTone,
  useStudioStore,
} from "@/lib/store";

export function CommandPaletteModal() {
  const {
    projectId,
    themeTone,
    setThemeTone,
    commandPaletteOpen,
    setCommandPaletteOpen,
    availableSkills,
    selectedSkills,
    toggleSkill,
    showWorkspaceFiles,
    setShowWorkspaceFiles,
    showSteppedProgress,
    setShowSteppedProgress,
    showSandboxShell,
    setShowSandboxShell,
    showEditor,
    setShowEditor,
    showPreviewConsole,
    setShowPreviewConsole,
    setSkillsModalOpen,
    setWorkspaceModalOpen,
    setGitModalOpen,
    setGovernanceOpen,
    bumpPreviewRefresh,
  } = useStudioStore();

  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      } else if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
    }
  }, [commandPaletteOpen]);

  const handleToggleSkill = async (skillId: string) => {
    const nextSkills = selectedSkills.includes(skillId)
      ? selectedSkills.filter((id) => id !== skillId)
      : [...selectedSkills, skillId];
    toggleSkill(skillId);
    try {
      await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: nextSkills }),
      });
    } catch {
      // ignore
    }
  };

  const q = query.trim().toLowerCase();

  const matchingThemes = STUDIO_THEMES.filter(
    (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.mode.toLowerCase().includes(q) ||
      t.tagline.toLowerCase().includes(q) ||
      "theme tone light dark".includes(q)
  );

  const quickActions = [
    {
      id: "toggle-files",
      label: `${showWorkspaceFiles ? "Hide" : "Show"} Workspace Files Drawer`,
      category: "Layout & Panels",
      icon: FolderTree,
      onRun: () => {
        setShowWorkspaceFiles(!showWorkspaceFiles);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "toggle-steps",
      label: `${showSteppedProgress ? "Hide" : "Show"} Stepped Task Progress`,
      category: "Layout & Panels",
      icon: ListChecks,
      onRun: () => {
        setShowSteppedProgress(!showSteppedProgress);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "toggle-shell",
      label: `${showSandboxShell ? "Hide" : "Show"} Sandbox Shell Stream (Xterm.js)`,
      category: "Layout & Panels",
      icon: Terminal,
      onRun: () => {
        setShowSandboxShell(!showSandboxShell);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "toggle-editor",
      label: `${showEditor ? "Hide" : "Show"} Monaco Code Editor & Diff Pane`,
      category: "Layout & Panels",
      icon: Code2,
      onRun: () => {
        setShowEditor(!showEditor);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "toggle-console",
      label: `${showPreviewConsole ? "Hide" : "Show"} Runtime Preview Console`,
      category: "Layout & Panels",
      icon: TerminalSquare,
      onRun: () => {
        setShowPreviewConsole(!showPreviewConsole);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: "open-skills",
      label: `Open LLM Skills Registry (${availableSkills.length} Skills Available)`,
      category: "Studio Modals",
      icon: Wand2,
      onRun: () => {
        setCommandPaletteOpen(false);
        setSkillsModalOpen(true);
      },
    },
    {
      id: "open-workspaces",
      label: "Create, Switch, or Import Workspace",
      category: "Studio Modals",
      icon: FolderPlus,
      onRun: () => {
        setCommandPaletteOpen(false);
        setWorkspaceModalOpen(true);
      },
    },
    {
      id: "open-git",
      label: "Export Workspace to Git or Download ZIP Archive",
      category: "Studio Modals",
      icon: FolderGit2,
      onRun: () => {
        setCommandPaletteOpen(false);
        setGitModalOpen(true);
      },
    },
    {
      id: "open-governance",
      label: "Inspect Container Governance & Sandbox Telemetry",
      category: "Studio Modals",
      icon: Cpu,
      onRun: () => {
        setCommandPaletteOpen(false);
        setGovernanceOpen(true);
      },
    },
    {
      id: "reload-preview",
      label: "Reload Live Container Preview Viewport",
      category: "Actions",
      icon: RefreshCw,
      onRun: () => {
        bumpPreviewRefresh();
        setCommandPaletteOpen(false);
      },
    },
  ].filter(
    (item) =>
      !q ||
      item.label.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  );

  const matchingSkills = availableSkills
    .filter(
      (sk) =>
        q &&
        (sk.name.toLowerCase().includes(q) ||
          sk.category.toLowerCase().includes(q) ||
          sk.id.toLowerCase().includes(q))
    )
    .slice(0, 8);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCommandPaletteOpen(false)}
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-start justify-center pt-[10vh] p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bento-glass rounded-2xl overflow-hidden flex flex-col max-h-[76vh]"
          >
            {/* Search Input Header */}
            <div className="px-4 py-3.5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50">
              <Search className="w-4 h-4 text-indigo-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command, switch theme tone (light/dark), or search 116 LLM skills..."
                className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                ESC
              </span>
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="p-3.5 overflow-y-auto space-y-4">
              {/* Theme Tone Selection Section */}
              {matchingThemes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="px-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3 h-3 text-indigo-400" />
                      Studio Theme Tones (Lighter &amp; Darker)
                    </span>
                    <span>Active: {themeTone}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {matchingThemes.map((t) => {
                      const active = themeTone === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setThemeTone(t.id as ThemeTone);
                            setCommandPaletteOpen(false);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 transition ${
                            active
                              ? "bg-indigo-600/20 border-indigo-500/50 text-slate-100"
                              : "bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-6 h-6 rounded-lg border border-white/20 flex items-center justify-center shrink-0 shadow-inner"
                              style={{ backgroundColor: t.swatchBg }}
                            >
                              {t.mode === "light" ? (
                                <Sun
                                  className="w-3.5 h-3.5"
                                  style={{ color: t.swatchAccent }}
                                />
                              ) : (
                                <Moon
                                  className="w-3.5 h-3.5"
                                  style={{ color: t.swatchAccent }}
                                />
                              )}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                <span>{t.name}</span>
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 leading-none rounded bg-slate-950/80 border border-slate-800 text-indigo-300">
                                  {t.mode}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {t.tagline}
                              </p>
                            </div>
                          </div>
                          {active && (
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Studio Commands */}
              {quickActions.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Workspace &amp; Panel Commands
                  </div>
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onRun}
                        className="w-full px-3 py-2 rounded-xl hover:bg-indigo-600/15 border border-transparent hover:border-indigo-500/30 flex items-center justify-between gap-3 text-xs text-slate-200 transition"
                      >
                        <span className="flex items-center gap-2.5 truncate">
                          <Icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Matching LLM Skills when searching */}
              {matchingSkills.length > 0 && (
                <div className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Matching LLM Skills (Click to Toggle)
                  </div>
                  {matchingSkills.map((sk) => {
                    const active = selectedSkills.includes(sk.id);
                    return (
                      <button
                        key={sk.id}
                        type="button"
                        onClick={() => handleToggleSkill(sk.id)}
                        className="w-full px-3 py-2 rounded-xl hover:bg-indigo-600/15 border border-transparent hover:border-indigo-500/30 flex items-center justify-between gap-3 text-xs text-slate-200 transition"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="font-semibold truncate">{sk.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({sk.category})
                          </span>
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            active
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/35"
                              : "bg-slate-900 text-slate-400 border-slate-800"
                          }`}
                        >
                          {active ? "✓ Equipped" : "Equip"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Command className="w-3 h-3 text-indigo-400" />
                <span>VibeForge Command Bar &bull; Press Ctrl+K anytime</span>
              </span>
              <span className="font-mono text-[10px]">
                {selectedSkills.length} / {availableSkills.length} Skills Active
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
