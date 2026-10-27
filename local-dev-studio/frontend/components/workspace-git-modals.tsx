"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Download,
  FolderGit2,
  FolderInput,
  FolderPlus,
  GitBranch,
  GitCommit,
  Layers,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { BACKEND_HTTP, LLMSkill, useStudioStore } from "@/lib/store";

export function WorkspaceManagerModal() {
  const {
    projectId,
    workspaces,
    availableSkills,
    setAvailableSkills,
    setSelectedSkills,
    setProjectId,
    setWorkspaces,
    workspaceModalOpen,
    setWorkspaceModalOpen,
    setSkillsModalOpen,
    appendConsoleLog,
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<"switch" | "create" | "import">(
    "switch"
  );
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newTemplate, setNewTemplate] = useState("nextjs");
  const [newWorkspaceSkills, setNewWorkspaceSkills] = useState<string[]>([]);
  const [importTargetName, setImportTargetName] = useState("");
  const [importSourcePath, setImportSourcePath] = useState("");
  const [importSkills, setImportSkills] = useState<string[]>([]);
  const [skillFilterCategory, setSkillFilterCategory] = useState<string>("All");
  const [skillSearch, setSkillSearch] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchWorkspacesAndSkills = async () => {
    try {
      const [wsRes, skRes] = await Promise.all([
        fetch(`${BACKEND_HTTP}/api/workspaces`),
        fetch(`${BACKEND_HTTP}/api/skills`),
      ]);
      if (wsRes.ok) {
        const list = await wsRes.json();
        setWorkspaces(list);
      }
      if (skRes.ok) {
        const skList: LLMSkill[] = await skRes.json();
        setAvailableSkills(skList);
      }
    } catch (e) {
      console.warn("Failed to list workspaces or skills:", e);
    }
  };

  useEffect(() => {
    if (workspaceModalOpen) {
      setErrorMsg("");
      fetchWorkspacesAndSkills();
    }
  }, [workspaceModalOpen]);

  const toggleNewWsSkill = (skillId: string) => {
    setNewWorkspaceSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleImportSkill = (skillId: string) => {
    setImportSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((id) => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/workspaces/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: newWorkspaceName.trim(),
          template: newTemplate,
          skills: newWorkspaceSkills,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create workspace");
      }
      const summary = await res.json();
      await fetchWorkspacesAndSkills();
      setProjectId(summary.project_id);
      setSelectedSkills(summary.skills || newWorkspaceSkills);
      appendConsoleLog(
        `[Workspace] Created and switched to workspace '${summary.project_id}' with ${newWorkspaceSkills.length} LLM skill(s)`
      );
      setNewWorkspaceName("");
      setNewWorkspaceSkills([]);
      setWorkspaceModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleImportWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTargetName.trim() || !importSourcePath.trim()) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/workspaces/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: importTargetName.trim(),
          source: importSourcePath.trim(),
          skills: importSkills,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to import workspace");
      }
      const summary = await res.json();
      await fetchWorkspacesAndSkills();
      setProjectId(summary.project_id);
      setSelectedSkills(summary.skills || importSkills);
      appendConsoleLog(
        `[Workspace] Imported '${importSourcePath.trim()}' into workspace '${summary.project_id}'`
      );
      setImportTargetName("");
      setImportSourcePath("");
      setImportSkills([]);
      setWorkspaceModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const skillCategories = [
    "All",
    ...Array.from(new Set(availableSkills.map((s) => s.category))),
  ];

  const visibleChecklistSkills = availableSkills.filter((sk) => {
    const matchesCat =
      skillFilterCategory === "All" || sk.category === skillFilterCategory;
    const q = skillSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      sk.name.toLowerCase().includes(q) ||
      sk.description.toLowerCase().includes(q) ||
      sk.category.toLowerCase().includes(q) ||
      sk.id.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const renderSkillsChecklist = (
    chosen: string[],
    onToggle: (id: string) => void,
    onSelectAll: () => void,
    onClear: () => void
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            Equip LLM Skills ({chosen.length} of {availableSkills.length} selected)
          </span>
        </label>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-indigo-400 hover:text-indigo-200 font-medium"
          >
            Select All ({availableSkills.length})
          </button>
          <span className="text-slate-600">&bull;</span>
          <button
            type="button"
            onClick={onClear}
            className="text-slate-400 hover:text-slate-200"
          >
            Clear
          </button>
          <span className="text-slate-600">&bull;</span>
          <button
            type="button"
            onClick={() => {
              setWorkspaceModalOpen(false);
              setSkillsModalOpen(true);
            }}
            className="text-emerald-400 hover:text-emerald-200 font-medium"
          >
            + Custom Skill
          </button>
        </div>
      </div>

      {/* Selected Skills in Workspace Summary Box */}
      {chosen.length > 0 && (
        <div className="rounded-xl bg-indigo-950/30 border border-indigo-500/35 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-200">
            <span>Selected Skills for Workspace ({chosen.length})</span>
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] text-slate-400 hover:text-rose-300"
            >
              Remove All
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {chosen.map((sid) => {
              const skObj = availableSkills.find((s) => s.id === sid);
              return (
                <span
                  key={sid}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-indigo-500/40 text-[10px] font-medium text-indigo-200"
                >
                  <span>{skObj ? skObj.name : sid}</span>
                  <button
                    type="button"
                    onClick={() => onToggle(sid)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + Category Pills inside Create/Import Workspace */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder={`Filter ${availableSkills.length} LLM skills...`}
            className="w-full rounded-lg bg-slate-900 border border-slate-800 pl-7 pr-2.5 py-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {skillCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSkillFilterCategory(cat)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap border transition ${
                skillFilterCategory === cat
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
        {visibleChecklistSkills.map((sk) => {
          const isChecked = chosen.includes(sk.id);
          return (
            <div
              key={sk.id}
              onClick={() => onToggle(sk.id)}
              className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2.5 transition ${
                isChecked
                  ? "bg-indigo-600/20 border-indigo-500/50 text-slate-100"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
              }`}
            >
              <div
                className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border shrink-0 transition ${
                  isChecked
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-950 border-slate-700"
                }`}
              >
                {isChecked && <Check className="w-3 h-3" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate">{sk.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-white/10 text-indigo-300 shrink-0">
                    {sk.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {sk.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {workspaceModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Workspace &amp; Project Manager
                  </h3>
                  <p className="text-xs text-slate-400">
                    Switch active workspace, create a new app with LLM skills ({availableSkills.length} available), or import a repo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWorkspaceModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-3 bg-slate-900/40 border-b border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("switch")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "switch"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Load Existing ({workspaces.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("create")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "create"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New App Workspace</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("import")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === "import"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <FolderInput className="w-3.5 h-3.5" />
                <span>Import Folder / Repo</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              {activeTab === "switch" && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {workspaces.map((ws) => {
                    const isCurrent = ws.project_id === projectId;
                    const wsSkills = ws.skills || [];
                    return (
                      <div
                        key={ws.project_id}
                        onClick={() => {
                          setProjectId(ws.project_id);
                          setSelectedSkills(wsSkills);
                          appendConsoleLog(
                            `[Workspace] Loaded workspace '${ws.project_id}'`
                          );
                          setWorkspaceModalOpen(false);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition ${
                          isCurrent
                            ? "bg-indigo-600/15 border-indigo-500/40 text-indigo-200"
                            : "bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-200"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold font-mono">
                              {ws.project_id}
                            </span>
                            {ws.has_git && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Git Repo
                              </span>
                            )}
                            {wsSkills.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                ✦ {wsSkills.length}{" "}
                                {wsSkills.length === 1 ? "Skill" : "Skills"}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ws.file_count} files &bull; Updated{" "}
                            {new Date(ws.last_modified).toLocaleTimeString()}
                          </p>
                          {wsSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {wsSkills.map((sid) => (
                                <span
                                  key={sid}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300"
                                >
                                  {sid}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-indigo-400 shrink-0">
                          {isCurrent ? "Active" : "Load →"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "create" && (
                <form onSubmit={handleCreateWorkspace} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        New Workspace ID
                      </label>
                      <input
                        type="text"
                        required
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        placeholder="e.g. ecommerce-portal, saas-studio"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Framework Template
                      </label>
                      <select
                        value={newTemplate}
                        onChange={(e) => setNewTemplate(e.target.value)}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none"
                      >
                        <optgroup label="Web & Full-Stack Templates">
                          <option value="nextjs">
                            Next.js 15 (App Router + Tailwind)
                          </option>
                          <option value="vite">Vite + React + TypeScript</option>
                          <option value="node">Node.js Full-Stack Sandbox</option>
                        </optgroup>
                        <optgroup label="AI-Native Starter Blueprints (RAG + SQLite + MCP)">
                          <option value="rag-copilot">
                            AI RAG Copilot (Document Ingestion + Vector Search)
                          </option>
                          <option value="agent-workflow">
                            Multi-Agent Studio (Tool-Calling + MCP Bridge)
                          </option>
                          <option value="sql-analyst">
                            SQL + AI Analyst (Workspace SQLite + Chart.js)
                          </option>
                          <option value="voice-vision">
                            Multimodal AI App (Prompt + Media Telemetry)
                          </option>
                          <option value="aws-ai-app">
                            AWS Bedrock &amp; Serverless AI Portal
                          </option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  {renderSkillsChecklist(
                    newWorkspaceSkills,
                    toggleNewWsSkill,
                    () => setNewWorkspaceSkills(availableSkills.map((s) => s.id)),
                    () => setNewWorkspaceSkills([])
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FolderPlus className="w-4 h-4" />
                    )}
                    <span>
                      Create &amp; Switch to New Workspace
                      {newWorkspaceSkills.length > 0
                        ? ` (${newWorkspaceSkills.length} LLM Skills)`
                        : ""}
                    </span>
                  </button>
                </form>
              )}

              {activeTab === "import" && (
                <form onSubmit={handleImportWorkspace} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Destination Workspace Name
                    </label>
                    <input
                      type="text"
                      required
                      value={importTargetName}
                      onChange={(e) => setImportTargetName(e.target.value)}
                      placeholder="e.g. imported-project"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Local Directory Path or Git Clone URL
                    </label>
                    <input
                      type="text"
                      required
                      value={importSourcePath}
                      onChange={(e) => setImportSourcePath(e.target.value)}
                      placeholder="e.g. C:\projects\my-app or https://github.com/org/repo.git"
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {renderSkillsChecklist(
                    importSkills,
                    toggleImportSkill,
                    () => setImportSkills(availableSkills.map((s) => s.id)),
                    () => setImportSkills([])
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FolderInput className="w-4 h-4" />
                    )}
                    <span>Import Existing App into Studio</span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LLMSkillsModal() {
  const {
    projectId,
    availableSkills,
    setAvailableSkills,
    selectedSkills,
    setSelectedSkills,
    toggleSkill,
    skillsModalOpen,
    setSkillsModalOpen,
    setWorkspaceModalOpen,
    appendConsoleLog,
  } = useStudioStore();

  const [tab, setTab] = useState<"catalog" | "create">("catalog");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [savingWorkspaceSkills, setSavingWorkspaceSkills] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  // Create custom skill form state
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("UI/UX & Design Systems");
  const [customDescription, setCustomDescription] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [creatingSkill, setCreatingSkill] = useState(false);

  const fetchSkills = async () => {
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/skills`);
      if (res.ok) {
        const data: LLMSkill[] = await res.json();
        setAvailableSkills(data);
      }
    } catch (e) {
      console.warn("Failed to load LLM skills:", e);
    }
  };

  useEffect(() => {
    if (skillsModalOpen) {
      setSavedBanner(null);
      fetchSkills();
    }
  }, [skillsModalOpen]);

  const persistWorkspaceSkills = async (nextSkills: string[]) => {
    setSavingWorkspaceSkills(true);
    try {
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${projectId}/skills`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills: nextSkills }),
        }
      );
      if (res.ok) {
        setSavedBanner(
          `Updated active LLM skills (${nextSkills.length}) for workspace '${projectId}'`
        );
        appendConsoleLog(
          `[LLM Skills] Equipped ${nextSkills.length} skill(s) on workspace '${projectId}': ${
            nextSkills.join(", ") || "none"
          }`
        );
      }
    } catch (e) {
      console.warn("Failed to update workspace skills:", e);
    } finally {
      setSavingWorkspaceSkills(false);
    }
  };

  const handleToggleSkillForWorkspace = async (skillId: string) => {
    const nextSkills = selectedSkills.includes(skillId)
      ? selectedSkills.filter((id) => id !== skillId)
      : [...selectedSkills, skillId];
    toggleSkill(skillId);
    await persistWorkspaceSkills(nextSkills);
  };

  const handleCreateCustomSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customDescription.trim() || !customInstructions.trim())
      return;
    setCreatingSkill(true);
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          category: customCategory.trim(),
          description: customDescription.trim(),
          instructions: customInstructions.trim(),
          tags: [customCategory.trim(), "Custom SKILL.md"],
        }),
      });
      if (res.ok) {
        const created: LLMSkill = await res.json();
        await fetchSkills();
        const nextSkills = Array.from(new Set([...selectedSkills, created.id]));
        setSelectedSkills(nextSkills);
        await persistWorkspaceSkills(nextSkills);
        setCustomName("");
        setCustomDescription("");
        setCustomInstructions("");
        setTab("catalog");
        setSavedBanner(
          `Created custom skill '${created.name}' (.agents/skills/${created.id}/SKILL.md) and equipped it on '${projectId}'`
        );
      }
    } finally {
      setCreatingSkill(false);
    }
  };

  const categories = [
    "All",
    ...Array.from(new Set(availableSkills.map((s) => s.category))),
  ];

  const filteredSkills = availableSkills.filter((s) => {
    const matchesCat =
      activeCategory === "All" || s.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.tags && s.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesCat && matchesQuery;
  });

  return (
    <AnimatePresence>
      {skillsModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/25 to-violet-500/25 border border-indigo-500/40">
                  <Wand2 className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100">
                      LLM Model &amp; Agent Skills Registry
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-semibold">
                      Workspace: {projectId} ({selectedSkills.length} /{" "}
                      {availableSkills.length} active)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Select from {availableSkills.length} specialized LLM skills to use while creating a new workspace or extending the current project
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSkillsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-900/40 border-b border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setTab("catalog")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                  tab === "catalog"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Available LLM Skills ({availableSkills.length}) &bull;{" "}
                  {selectedSkills.length} Equipped
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTab("create")}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition ${
                  tab === "create"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom LLM Skill (SKILL.md)</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1 min-h-0">
              {savedBanner && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{savedBanner}</span>
                  </div>
                  {savingWorkspaceSkills && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                  )}
                </div>
              )}

              {tab === "catalog" ? (
                <>
                  {/* Dedicated Section: Selected Skills in Workspace */}
                  <div className="rounded-2xl bg-indigo-950/25 border border-indigo-500/35 p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span className="text-xs font-bold text-slate-100">
                          Selected Skills in Workspace ({projectId})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/35 text-[10px] font-mono text-indigo-200">
                          {selectedSkills.length} active
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            const qwenPack = [
                              "qwen25-coder-7b-mastery",
                              "qwen-csv-excel-analytics-engine",
                              "qwen-reactive-tailwind-chartjs",
                              "qwen-multi-turn-context-evolver",
                              "qwen-self-healing-compiler-loop",
                            ];
                            const merged = Array.from(
                              new Set([...selectedSkills, ...qwenPack])
                            );
                            setSelectedSkills(merged);
                            await persistWorkspaceSkills(merged);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-[10px] font-semibold text-indigo-200 transition"
                        >
                          + Append Qwen 2.5 Coder Pack
                        </button>
                        {selectedSkills.length > 0 && (
                          <button
                            type="button"
                            onClick={async () => {
                              setSelectedSkills([]);
                              await persistWorkspaceSkills([]);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-[10px] font-semibold text-slate-400 hover:text-rose-200 transition"
                          >
                            Clear Selected
                          </button>
                        )}
                      </div>
                    </div>

                    {selectedSkills.length === 0 ? (
                      <p className="text-[11px] text-slate-400">
                        No skills currently selected for workspace{" "}
                        <span className="font-mono text-slate-200">
                          {projectId}
                        </span>
                        . Click <strong>+ Append Qwen 2.5 Coder Pack</strong> or
                        select skills below.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                        {selectedSkills.map((sid, idx) => {
                          const skObj = availableSkills.find(
                            (s) => s.id === sid
                          );
                          return (
                            <div
                              key={sid}
                              className="rounded-xl bg-slate-950/90 border border-indigo-500/30 px-2.5 py-1.5 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-indigo-400 font-bold">
                                    #{idx + 1}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-100 truncate">
                                    {skObj ? skObj.name : sid}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] text-emerald-300 font-medium truncate">
                                    {skObj
                                      ? skObj.category
                                      : "Workspace Skill"}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-500 truncate">
                                    ({sid})
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleSkillForWorkspace(sid)
                                }
                                className="p-1 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 shrink-0 transition"
                                title="Remove skill from workspace"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Search + Bulk Actions */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${availableSkills.length} LLM skills by name, category, or tag...`}
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const visibleIds = filteredSkills.map((s) => s.id);
                        const merged = Array.from(
                          new Set([...selectedSkills, ...visibleIds])
                        );
                        setSelectedSkills(merged);
                        await persistWorkspaceSkills(merged);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-300 transition whitespace-nowrap"
                    >
                      Equip Shown ({filteredSkills.length})
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setSelectedSkills([]);
                        await persistWorkspaceSkills([]);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition whitespace-nowrap"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {categories.map((cat) => {
                      const count =
                        cat === "All"
                          ? availableSkills.length
                          : availableSkills.filter((s) => s.category === cat)
                              .length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCategory(cat)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition ${
                            activeCategory === cat
                              ? "bg-indigo-600 text-white border-indigo-500"
                              : "bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Skills List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {filteredSkills.map((skill) => {
                      const isEquipped = selectedSkills.includes(skill.id);
                      const isExpanded = expandedSkillId === skill.id;
                      return (
                        <div
                          key={skill.id}
                          className={`rounded-2xl border p-3.5 transition flex flex-col justify-between ${
                            isEquipped
                              ? "bg-indigo-600/15 border-indigo-500/45"
                              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div
                                onClick={() =>
                                  handleToggleSkillForWorkspace(skill.id)
                                }
                                className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0"
                              >
                                <div
                                  className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border shrink-0 transition ${
                                    isEquipped
                                      ? "bg-indigo-600 border-indigo-400 text-white shadow-sm shadow-indigo-600/40"
                                      : "bg-slate-950 border-slate-700 text-transparent"
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-100">
                                      {skill.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      {skill.category}
                                    </span>
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300">
                                      {skill.id}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleSkillForWorkspace(skill.id)
                                }
                                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border shrink-0 transition ${
                                  isEquipped
                                    ? "bg-indigo-600 text-white border-indigo-500"
                                    : "bg-slate-950 text-slate-300 border-slate-800 hover:border-indigo-500/40"
                                }`}
                              >
                                {isEquipped ? "✓ Equipped" : "Equip"}
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                              {skill.description}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1 min-w-0">
                              {skill.tags?.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/90 border border-white/10 text-slate-400"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSkillId(
                                  isExpanded ? null : skill.id
                                )
                              }
                              className="text-[10px] text-indigo-400 hover:text-indigo-200 font-mono shrink-0"
                            >
                              {isExpanded ? "Hide ▲" : "Directives ▼"}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/90 text-[10px] font-mono text-indigo-200 bg-slate-950/90 p-2.5 rounded-xl whitespace-pre-wrap">
                              {skill.instructions}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <form onSubmit={handleCreateCustomSkill} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Skill Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. WebRTC Live Video Streaming"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        required
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g. UI/UX & Design Systems"
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Short Description
                    </label>
                    <input
                      type="text"
                      required
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Describe when and how the LLM should apply this skill..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      LLM System Directives &amp; SKILL.md Instructions
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Write the exact architectural rules, design tokens, or code patterns the LLM must follow when this skill is equipped..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingSkill}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    {creatingSkill ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Save Custom Skill to SKILL.md &amp; Equip on Workspace</span>
                  </button>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSkillsModalOpen(false);
                  setWorkspaceModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-indigo-300 transition flex items-center gap-1.5"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Use Skills in New Workspace...</span>
              </button>

              <button
                type="button"
                onClick={() => setSkillsModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
              >
                Done ({selectedSkills.length} Active on &apos;{projectId}&apos;)
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface GitStatusInfo {
  project_id: string;
  initialized: boolean;
  branch: string;
  remote_url: string;
  status_lines: string[];
  recent_commits: string[];
  workspace_path: string;
}

export function GitExportModal() {
  const { projectId, gitModalOpen, setGitModalOpen, appendConsoleLog } =
    useStudioStore();

  const [gitInfo, setGitInfo] = useState<GitStatusInfo | null>(null);
  const [commitMessage, setCommitMessage] = useState(
    "feat: export autonomous studio workspace"
  );
  const [branch, setBranch] = useState("main");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [pushToRemote, setPushToRemote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultBanner, setResultBanner] = useState<string | null>(null);

  const fetchGitStatus = async () => {
    try {
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${projectId}/git/status`
      );
      if (res.ok) {
        const data: GitStatusInfo = await res.json();
        setGitInfo(data);
        if (data.branch) setBranch(data.branch);
        if (data.remote_url) setRemoteUrl(data.remote_url);
      }
    } catch (e) {
      console.warn("Failed to load git status:", e);
    }
  };

  useEffect(() => {
    if (gitModalOpen) {
      setResultBanner(null);
      fetchGitStatus();
    }
  }, [gitModalOpen, projectId]);

  const handleGitExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResultBanner(null);
    try {
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${projectId}/git/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commit_message: commitMessage,
            branch,
            remote_url: remoteUrl || null,
            push: pushToRemote,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setGitInfo(data.git_status);
        setResultBanner(
          `Committed to Git branch '${branch}' in ${data.git_status.workspace_path}` +
            (data.pushed ? " and pushed to remote." : ".")
        );
        appendConsoleLog(
          `[Git Export] Workspace '${projectId}' committed on branch '${branch}'.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {gitModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <FolderGit2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Export Workspace to Git &amp; Archive
                  </h3>
                  <p className="text-xs text-slate-400">
                    Initialize Git repository, commit changes, push to remote, or download ZIP bundle
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setGitModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <form onSubmit={handleGitExport} className="p-5 space-y-4">
              {resultBanner && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="break-all">{resultBanner}</span>
                </div>
              )}

              {/* Git Status Summary */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Repository Status:</span>
                  <span className="font-mono font-semibold text-emerald-300">
                    {gitInfo?.initialized
                      ? `Initialized (${gitInfo.branch})`
                      : "Not initialized yet (will run git init)"}
                  </span>
                </div>
                {gitInfo?.workspace_path && (
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    Path: {gitInfo.workspace_path}
                  </div>
                )}
                {gitInfo?.recent_commits && gitInfo.recent_commits.length > 0 && (
                  <div className="pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">
                      Recent Commits:
                    </span>
                    <div className="mt-1 space-y-0.5 font-mono text-[11px] text-slate-300">
                      {gitInfo.recent_commits.slice(0, 3).map((c, i) => (
                        <div key={i} className="truncate">
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Commit Message
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                    <GitCommit className="w-3.5 h-3.5 text-indigo-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Branch
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 px-3 py-2">
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-transparent text-xs font-mono text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Remote Origin URL (Optional)
                </label>
                <input
                  type="text"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="https://github.com/username/repository.git"
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {remoteUrl.trim() && (
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushToRemote}
                    onChange={(e) => setPushToRemote(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span>
                    Push branch `{branch}` to remote `origin` after committing
                  </span>
                </label>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  <span>Commit &amp; Export to Git</span>
                </motion.button>

                <a
                  href={`${BACKEND_HTTP}/api/projects/${projectId}/git/archive`}
                  download={`${projectId}-git-export.zip`}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Download ZIP</span>
                </a>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
