"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  CircleDot,
  Clock,
  Eye,
  EyeOff,
  FileCode,
  FileDown,
  FolderOpen,
  History,
  Loader2,
  Lock,
  Play,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Terminal as TerminalIcon,
  User,
  Wand2,
  X,
  XCircle,
} from "lucide-react";
import { BACKEND_HTTP, BACKEND_WS, LLMSkill, useStudioStore } from "@/lib/store";
import { FileTree } from "./file-tree";
import { TerminalStream } from "./terminal-stream";

const TEMPLATE_LABELS: Record<string, string> = {
  nextjs: "Next.js 15",
  vite: "Vite + React",
  node: "Node.js Sandbox",
  "rag-copilot": "AI RAG Copilot",
  "agent-workflow": "Multi-Agent Studio",
  "sql-analyst": "SQL + AI Analyst",
  "voice-vision": "Multimodal AI App",
  "aws-ai-app": "AWS Bedrock AI App",
};

export function AgentConsole() {
  const {
    projectId,
    template,
    templateLocked,
    availableSkills,
    selectedSkills,
    setAvailableSkills,
    setSelectedSkills,
    toggleSkill,
    setSkillsModalOpen,
    chatHistory,
    files,
    setTemplate,
    setTemplateLocked,
    setChatHistory,
    steps,
    upsertStep,
    resetSteps,
    isRunningAgent,
    setIsRunningAgent,
    upsertFileDiff,
    setFiles,
    setActiveFilePath,
    setShowEditor,
    setPreviewUrl,
    bumpPreviewRefresh,
    appendConsoleLog,
    showWorkspaceFiles,
    setShowWorkspaceFiles,
    showSteppedProgress,
    setShowSteppedProgress,
    showSandboxShell,
    setShowSandboxShell,
    showSelectedSkills,
    setShowSelectedSkills,
  } = useStudioStore();

  const [prompt, setPrompt] = useState(
    "Create a responsive portal for UI/ UX animations for HTML5 and also when selected the respective type it also provide a sample code for the same"
  );
  const [activeMissionPrompt, setActiveMissionPrompt] = useState<string | null>(
    null
  );
  const [llmStatus, setLlmStatus] = useState<{
    online: boolean;
    model: string | null;
    endpoint: string;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const historyEndRef = useRef<HTMLDivElement | null>(null);

  const anyLeftSectionOpen =
    showWorkspaceFiles ||
    showSteppedProgress ||
    showSandboxShell ||
    showSelectedSkills;

  // Chronological order (oldest -> newest)
  const chronologicalHistory = useMemo(
    () => [...chatHistory].reverse(),
    [chatHistory]
  );
  const hasConversation =
    chronologicalHistory.length > 0 || Boolean(activeMissionPrompt);

  const equippedSkillObjects = useMemo(
    () =>
      selectedSkills.map(
        (id) =>
          availableSkills.find((s) => s.id === id) || {
            id,
            name: id,
            category: "Workspace Skill",
            description: "Equipped workspace skill",
            instructions: "",
            tags: [],
            source: "workspace",
          }
      ),
    [availableSkills, selectedSkills]
  );

  const fetchLlmStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/llm/status`);
      if (res.ok) {
        const data = await res.json();
        setLlmStatus(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchSkills = async () => {
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/skills`);
      if (res.ok) {
        const list: LLMSkill[] = await res.json();
        setAvailableSkills(list);
      }
    } catch (err) {
      console.warn("Failed to load LLM skills:", err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${projectId}/files`
      );
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (err) {
      console.warn("Failed to load workspace files:", err);
    }
  };

  const fetchChatHistoryAndMeta = async () => {
    try {
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${projectId}/chat-history`
      );
      if (res.ok) {
        const meta = await res.json();
        if (meta.template) setTemplate(meta.template);
        setTemplateLocked(Boolean(meta.template_locked));
        if (Array.isArray(meta.skills)) {
          const withDefaults = Array.from(
            new Set(["tokless", "taste-skill", ...meta.skills])
          );
          setSelectedSkills(withDefaults);
        }
        const list = Array.isArray(meta.chat_history) ? meta.chat_history : [];
        setChatHistory(list);
        if (list.length > 0) {
          setPrompt((prev) =>
            prev ===
            "Create a responsive portal for UI/ UX animations for HTML5 and also when selected the respective type it also provide a sample code for the same"
              ? ""
              : prev
          );
        }
      }
    } catch (err) {
      console.warn("Failed to load chat history:", err);
    }
  };

  useEffect(() => {
    fetchSkills();
    fetchLlmStatus();
  }, []);

  useEffect(() => {
    setActiveMissionPrompt(null);
    fetchFiles();
    fetchChatHistoryAndMeta();
    const ws = new WebSocket(`${BACKEND_WS}/ws/agent/${projectId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "step" && payload.step) {
          upsertStep(payload.step);
          appendConsoleLog(
            `[Agent:${payload.step.step_id}] ${payload.step.title} (${payload.step.status})`
          );
        } else if (payload.type === "diff" && payload.diff) {
          upsertFileDiff(
            payload.diff.file_path,
            payload.diff.modified_content,
            payload.diff.original_content
          );
        } else if (payload.type === "validation") {
          setIsRunningAgent(false);
          setTemplateLocked(true);
          if (payload.preview_url) {
            setPreviewUrl(payload.preview_url);
          }
          bumpPreviewRefresh();
          fetchFiles();
          fetchChatHistoryAndMeta().then(() => setActiveMissionPrompt(null));
        }
      } catch (e) {
        console.warn("Malformed agent event:", e);
      }
    };

    ws.onerror = () => {};

    return () => {
      ws.onmessage = null;
      ws.onerror = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [projectId]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length, activeMissionPrompt, steps.length]);

  const handleQuickRemoveSkill = async (skillId: string) => {
    const nextSkills = selectedSkills.filter((id) => id !== skillId);
    toggleSkill(skillId);
    try {
      await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: nextSkills }),
      });
    } catch (e) {
      console.warn("Failed to persist skill toggle:", e);
    }
  };

  const handleEquipQwenPack = async () => {
    const qwenIds = [
      "qwen25-coder-7b-mastery",
      "qwen-csv-excel-analytics-engine",
      "qwen-reactive-tailwind-chartjs",
      "qwen-multi-turn-context-evolver",
      "qwen-self-healing-compiler-loop",
    ];
    const nextSkills = Array.from(new Set([...selectedSkills, ...qwenIds]));
    setSelectedSkills(nextSkills);
    try {
      await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: nextSkills }),
      });
      appendConsoleLog(
        `[LLM Skills] Equipped Qwen 2.5 Coder 7B Skill Pack (${nextSkills.length} active) on workspace '${projectId}'`
      );
    } catch (e) {
      console.warn("Failed to persist Qwen pack:", e);
    }
  };

  const handleEquipTasteSkillPack = async () => {
    const tasteIds = [
      "taste-skill",
      "taste-minimalist-ui",
      "taste-soft-luxury",
      "taste-gpt-strict",
      "taste-redesign-audit",
    ];
    const nextSkills = Array.from(new Set([...selectedSkills, ...tasteIds]));
    setSelectedSkills(nextSkills);
    try {
      await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: nextSkills }),
      });
      appendConsoleLog(
        `[TasteSkill V2] Equipped TasteSkill Anti-Slop Art Direction Pack (${nextSkills.length} active) on workspace '${projectId}'`
      );
    } catch (e) {
      console.warn("Failed to persist TasteSkill pack:", e);
    }
  };

  const handleSelectTastePreset = async (
    presetSkillId: string,
    label: string,
    dials: string
  ) => {
    const tasteVariantIds = [
      "taste-skill",
      "taste-minimalist-ui",
      "taste-soft-luxury",
      "taste-gpt-strict",
      "taste-redesign-audit",
    ];
    const filtered = selectedSkills.filter(
      (id) => !tasteVariantIds.includes(id)
    );
    const nextSkills = Array.from(
      new Set(["tokless", "taste-skill", presetSkillId, ...filtered])
    );
    setSelectedSkills(nextSkills);
    try {
      await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: nextSkills }),
      });
      appendConsoleLog(
        `[TasteSkill V2] Selected Preset: ${label} (${dials})`
      );
    } catch (e) {
      console.warn("Failed to persist TasteSkill preset:", e);
    }
  };

  const handleEquipToklessPack = async () => {
    const toklessIds = [
      "tokless",
      "tokless-ast-context-pruner",
      "tokless-kv-cache-aligner",
      "tokless-data-driven-ui-loop",
    ];
    const nextSkills = Array.from(new Set([...selectedSkills, ...toklessIds]));
    setSelectedSkills(nextSkills);
    try {
      await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: nextSkills }),
      });
      appendConsoleLog(
        `[LLM Skills] Equipped Tokless Token Optimization Pack (${nextSkills.length} active) on workspace '${projectId}'`
      );
    } catch (e) {
      console.warn("Failed to persist Tokless pack:", e);
    }
  };

  const handleEquipAwsPack = async () => {
    const awsIds = [
      "aws-cloud-architect",
      "aws-serverless-event-driven",
      "aws-cdk-terraform-iac",
      "aws-bedrock-genai-agents",
      "aws-finops-cloudwatch-telemetry",
    ];
    const nextSkills = Array.from(new Set([...selectedSkills, ...awsIds]));
    setSelectedSkills(nextSkills);
    try {
      await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: nextSkills }),
      });
      appendConsoleLog(
        `[LLM Skills] Equipped AWS Cloud & Architecture Skill Pack (${nextSkills.length} active) on workspace '${projectId}'`
      );
    } catch (e) {
      console.warn("Failed to persist AWS pack:", e);
    }
  };

  const handleRunAgent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const submittedPrompt = prompt.trim();
    if (!submittedPrompt || isRunningAgent) return;

    setActiveMissionPrompt(submittedPrompt);
    setPrompt("");
    resetSteps();
    setIsRunningAgent(true);
    setTemplateLocked(true);
    appendConsoleLog(
      `[VibeForge] Dispatching mission: "${submittedPrompt}" (Skills: ${
        selectedSkills.join(", ") || "none"
      })`
    );

    try {
      const res = await fetch(`${BACKEND_HTTP}/api/projects/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          template,
          prompt: submittedPrompt,
          skills: selectedSkills,
        }),
      });
      if (res.ok) {
        const report = await res.json();
        if (report.preview_url) {
          setPreviewUrl(report.preview_url);
        }
        bumpPreviewRefresh();
        await fetchFiles();
        await fetchChatHistoryAndMeta();
      }
    } catch (err) {
      appendConsoleLog(`[Error] Failed to trigger agent: ${String(err)}`);
    } finally {
      setActiveMissionPrompt(null);
      setIsRunningAgent(false);
    }
  };

  const renderStepIcon = (status: string) => {
    if (status === "completed")
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (status === "running")
      return (
        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
      );
    if (status === "failed")
      return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
    return <CircleDot className="w-4 h-4 text-slate-500 shrink-0" />;
  };

  const currentRunningStep =
    steps.find((s) => s.status === "running") || steps[steps.length - 1];

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="w-[420px] xl:w-[460px] shrink-0 bento-glass rounded-2xl flex flex-col h-full overflow-hidden select-none"
    >
      {/* Top Agent Bar */}
      <div className="px-3.5 py-2.5 border-b border-white/[0.08] flex items-center justify-between gap-2 bg-slate-950/75 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-400/30 shrink-0">
            <Bot className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-xs font-bold tracking-[-0.02em] text-slate-100 whitespace-nowrap">
              Staff Engineer Agent
            </h2>
            <p className="text-[10px] font-medium text-emerald-300/95 truncate flex items-center gap-1 tabular-nums">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">
                {llmStatus?.online
                  ? `Local LLM: ${llmStatus.model?.replace("-instruct-q4_k_m.gguf", "") || "Qwen2.5-Coder"}`
                  : "Local LLM Engine Ready"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {templateLocked || isRunningAgent ? (
            <div
              className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/35 text-amber-200 text-xs rounded-xl px-2.5 py-1.5 whitespace-nowrap"
              title="Framework is locked for this workspace"
            >
              <Lock className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="font-semibold">
                {TEMPLATE_LABELS[template] || template}
              </span>
            </div>
          ) : (
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="bg-slate-950 border border-white/[0.08] text-slate-100 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500/60 cursor-pointer whitespace-nowrap"
              title="Select Framework or AI-Native Blueprint"
            >
              <optgroup label="Web & Full-Stack">
                <option value="nextjs">Next.js 15</option>
                <option value="vite">Vite + React</option>
                <option value="node">Node.js Sandbox</option>
              </optgroup>
              <optgroup label="AI-Native Blueprints (RAG + SQLite + MCP)">
                <option value="rag-copilot">AI RAG Copilot</option>
                <option value="agent-workflow">Multi-Agent Studio</option>
                <option value="sql-analyst">SQL + AI Analyst</option>
                <option value="voice-vision">Multimodal AI App</option>
                <option value="aws-ai-app">AWS Bedrock AI App</option>
              </optgroup>
            </select>
          )}
        </div>
      </div>

      {/* Main Mission Area (History Stream + Prompt Composer) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Scrollable History Thread (shown when prompts have been executed) */}
        {hasConversation && (
          <>
            <div className="px-4 py-2 border-b border-indigo-500/15 bg-slate-900/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-200">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Prompt History</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const activePid = projectId || "default";
                    try {
                      const res = await fetch(
                        `${BACKEND_HTTP}/api/projects/${activePid}/prompts`
                      );
                      if (!res.ok) return;
                      const data = await res.json();
                      const filename =
                        data.filename || `${activePid}-Prompts-v1.1.md`;
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
                        `[Prompts] Downloaded ${filename} (${data.version || "v1.1"})`
                      );
                      fetchFiles();
                    } catch (e) {
                      console.warn("Failed to download Prompts.md:", e);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/45 text-indigo-100 transition"
                  title="Download versioned Prompts.md file for this application"
                >
                  <FileDown className="w-2.5 h-2.5 text-indigo-300" />
                  <span>Download Prompts.md</span>
                </button>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 leading-none rounded-full bg-indigo-500/15 border border-indigo-400/35 text-indigo-200">
                  {chronologicalHistory.length}{" "}
                  {chronologicalHistory.length === 1 ? "run" : "runs"}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-0 select-text">
              {chronologicalHistory.map((item) => (
                <div key={item.id} className="space-y-2.5">
                  {/* User Prompt Bubble */}
                  <div className="flex items-start justify-end gap-2">
                    <div className="max-w-[92%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600/30 via-indigo-900/40 to-fuchsia-900/30 border border-indigo-400/45 shadow-md shadow-indigo-950/50 px-3.5 py-2.5 text-xs text-white">
                      <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-indigo-200">
                        <span className="font-bold flex items-center gap-1 text-fuchsia-300">
                          <User className="w-2.5 h-2.5" />
                          You
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono flex items-center gap-0.5 text-indigo-200/80">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPrompt(item.prompt)}
                            className="text-cyan-300 hover:text-white font-semibold flex items-center gap-0.5 transition"
                            title="Copy prompt to input box"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reuse</span>
                          </button>
                        </div>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap break-words font-medium text-slate-100">
                        {item.prompt}
                      </p>
                    </div>
                  </div>

                  {/* Agent Completion Bubble */}
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0 bento-card-interactive rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs text-slate-200">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white text-[11px]">
                          VibeForge Agent
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 leading-none rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {item.status === "completed" ? "Verified" : item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Completed in {item.iterations}{" "}
                        {item.iterations === 1 ? "iteration" : "iterations"} (
                        {TEMPLATE_LABELS[item.template] || item.template}).
                      </p>
                      {item.skills && item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.skills.map((sid) => (
                            <span
                              key={sid}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/35 text-[10px] font-mono text-indigo-200"
                            >
                              ✦ {sid}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.files_changed && item.files_changed.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.files_changed.map((fp) => (
                            <button
                              key={fp}
                              type="button"
                              onClick={() => {
                                setActiveFilePath(fp);
                                setShowEditor(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-indigo-600/25 border border-indigo-500/30 hover:border-indigo-400/60 text-[10px] font-mono text-indigo-200 transition"
                              title="Open file in Code Editor"
                            >
                              <FileCode className="w-2.5 h-2.5 text-indigo-400" />
                              <span>{fp}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Active Running Prompt */}
              {activeMissionPrompt && (
                <div className="space-y-2">
                  <div className="flex items-start justify-end gap-2">
                    <div className="max-w-[92%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600/35 to-fuchsia-600/25 border border-indigo-400/50 px-3.5 py-2.5 text-xs text-white">
                      <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-indigo-200">
                        <span className="font-bold flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          You
                        </span>
                        <span className="font-mono text-amber-300">Running</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap break-words">
                        {activeMissionPrompt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-xl bg-indigo-600/25 border border-indigo-400/40 shrink-0 mt-0.5">
                      <Loader2 className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-slate-900/90 border border-indigo-400/45 px-3.5 py-2.5 text-xs text-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-indigo-200 text-[11px]">
                          VibeForge Agent
                        </span>
                        <span className="text-[10px] font-mono text-fuchsia-300">
                          Synthesizing...
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200">
                        {currentRunningStep
                          ? `${currentRunningStep.title}${
                              currentRunningStep.detail
                                ? ` — ${currentRunningStep.detail}`
                                : ""
                            }`
                          : "Updating workspace files and verifying build..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={historyEndRef} />
            </div>
          </>
        )}

        {/* Mission Prompt Input Box + Launch Button + Left Section Dock */}
        <form
          onSubmit={handleRunAgent}
          className={`p-3.5 flex flex-col gap-2.5 ${
            hasConversation
              ? "border-t border-indigo-500/20 bg-slate-900/60 shrink-0"
              : "flex-1 min-h-0"
          }`}
        >
          <div className="flex items-center justify-between shrink-0">
            <label className="font-display text-xs font-bold tracking-[-0.02em] text-slate-100">
              {hasConversation ? "New Prompt" : "Mission Prompt"}
            </label>
            <button
              type="button"
              onClick={() => setSkillsModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-white transition tabular-nums"
            >
              <Wand2 className="w-3 h-3 text-indigo-400" />
              <span>
                {selectedSkills.length > 0
                  ? `${selectedSkills.length} Skills Equipped`
                  : `Add LLM Skills (${availableSkills.length})`}
              </span>
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* TasteSkill V2 Preset Direction Bar */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Taste:
            </span>
            {(
              [
                {
                  id: "taste-skill",
                  label: "⚡ Auto V2",
                  dials: "DV=6 MI=6 VD=5",
                },
                {
                  id: "taste-minimalist-ui",
                  label: "◻ Minimalist",
                  dials: "DV=6 MI=3 VD=3",
                },
                {
                  id: "taste-soft-luxury",
                  label: "✦ Soft",
                  dials: "DV=5 MI=6 VD=3",
                },
                {
                  id: "taste-gpt-strict",
                  label: "◢ Strict Bento",
                  dials: "DV=8 MI=7 VD=5",
                },
                {
                  id: "taste-redesign-audit",
                  label: "⟳ Audit",
                  dials: "DV=6 MI=5 VD=7",
                },
              ] as const
            ).map((preset) => {
              const isSelected =
                preset.id === "taste-skill"
                  ? selectedSkills.includes("taste-skill") &&
                    !selectedSkills.some((s) =>
                      [
                        "taste-minimalist-ui",
                        "taste-soft-luxury",
                        "taste-gpt-strict",
                        "taste-redesign-audit",
                      ].includes(s)
                    )
                  : selectedSkills.includes(preset.id);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    handleSelectTastePreset(
                      preset.id,
                      preset.label,
                      preset.dials
                    )
                  }
                  title={`TasteSkill Preset: ${preset.label} (${preset.dials})`}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold whitespace-nowrap transition ${
                    isSelected
                      ? "bg-indigo-500/25 border-indigo-400/50 text-indigo-100"
                      : "bg-slate-950/80 border-white/[0.08] text-slate-400 hover:text-slate-200 hover:border-white/20"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Show Equipped Skills Chips Only (keeps prompt composer clean) */}
          {equippedSkillObjects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 shrink-0">
              {equippedSkillObjects.map((sk) => (
                <span
                  key={sk.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/90 border border-white/[0.08] text-[10px] font-medium text-slate-200 whitespace-nowrap"
                >
                  <span>{sk.name}</span>
                  <button
                    type="button"
                    onClick={() => handleQuickRemoveSkill(sk.id)}
                    className="text-slate-400 hover:text-white"
                    title={`Remove ${sk.name}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Prompt Textarea */}
          <div
            className={`relative flex flex-col ${
              hasConversation ? "shrink-0" : "flex-1 min-h-0"
            }`}
          >
            <textarea
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              rows={hasConversation ? 3 : 6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRunAgent();
                }
              }}
              placeholder={
                hasConversation
                  ? "Enter a follow-up prompt to update the project..."
                  : "Describe the application or feature to build..."
              }
              className={`w-full rounded-xl bg-slate-950/95 border border-white/[0.09] p-3 pr-10 text-xs leading-relaxed text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/25 transition resize-none ${
                hasConversation ? "min-h-[76px]" : "flex-1 min-h-[140px]"
              }`}
            />
            <button
              type="submit"
              disabled={isRunningAgent || !prompt.trim()}
              className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-sm transition"
              title="Send Prompt"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Launch Autonomous Build Button */}
          <button
            type="submit"
            disabled={isRunningAgent || !prompt.trim()}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-indigo-950/50 border border-indigo-400/30 transition shrink-0 tabular-nums"
          >
            {isRunningAgent ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Build...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>
                  Launch Autonomous Build
                  {selectedSkills.length > 0
                    ? ` (${selectedSkills.length} ${
                        selectedSkills.length === 1 ? "Skill" : "Skills"
                      })`
                    : ""}
                </span>
              </>
            )}
          </button>

          {/* Left Section Icons Bar Below "Launch Autonomous Build" */}
          <div className="pt-1.5 border-t border-slate-800 grid grid-cols-4 gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowSelectedSkills(!showSelectedSkills)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-medium transition ${
                showSelectedSkills
                  ? "bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/45"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Toggle Selected Workspace Skills"
            >
              <Wand2 className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
              <span className="truncate">Skills ({selectedSkills.length})</span>
              {showSelectedSkills ? (
                <Eye className="w-3 h-3 text-fuchsia-400 shrink-0" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-500 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowWorkspaceFiles(!showWorkspaceFiles)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-medium transition ${
                showWorkspaceFiles
                  ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/45"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Toggle Workspace Files"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Files ({files.length})</span>
              {showWorkspaceFiles ? (
                <Eye className="w-3 h-3 text-indigo-400 shrink-0" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-500 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSteppedProgress(!showSteppedProgress)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-medium transition ${
                showSteppedProgress
                  ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/45"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Toggle Stepped Task Progress"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Steps ({steps.length})</span>
              {showSteppedProgress ? (
                <Eye className="w-3 h-3 text-indigo-400 shrink-0" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-500 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowSandboxShell(!showSandboxShell)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-medium transition ${
                showSandboxShell
                  ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/45"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Toggle Sandbox Shell"
            >
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Shell</span>
              {showSandboxShell ? (
                <Eye className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-500 shrink-0" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Selected Left Sections Area (Bounded height so it never crushes history/prompt) */}
      <AnimatePresence initial={false}>
        {anyLeftSectionOpen && (
          <motion.div
            key="left-sections-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="max-h-[42%] border-t border-slate-800 flex flex-col shrink-0 overflow-y-auto"
          >
            {/* Dedicated Section: Selected Skills in Workspace */}
            <AnimatePresence initial={false}>
              {showSelectedSkills && (
                <motion.div
                  key="selected-workspace-skills-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 space-y-2 border-b border-slate-800 bg-slate-950/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 min-w-0">
                      <Wand2 className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                      <span className="truncate">
                        Selected Skills in Workspace
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/35 text-[10px] font-mono text-fuchsia-300 shrink-0">
                        {projectId}: {equippedSkillObjects.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
                      <button
                        type="button"
                        onClick={handleEquipTasteSkillPack}
                        className="px-2 py-0.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/35 border border-violet-400/40 text-[10px] font-semibold text-violet-200 transition whitespace-nowrap"
                        title="Append TasteSkill V2 Anti-Slop Art Direction skills to this workspace"
                      >
                        + TasteSkill
                      </button>
                      <button
                        type="button"
                        onClick={handleEquipToklessPack}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 text-[10px] font-semibold text-emerald-200 transition whitespace-nowrap"
                        title="Append Tokless Token Optimization skills to this workspace"
                      >
                        + Tokless
                      </button>
                      <button
                        type="button"
                        onClick={handleEquipAwsPack}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-[10px] font-semibold text-amber-200 transition whitespace-nowrap"
                        title="Append AWS Cloud & Architecture skills to this workspace"
                      >
                        + AWS
                      </button>
                      <button
                        type="button"
                        onClick={handleEquipQwenPack}
                        className="px-2 py-0.5 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/40 border border-indigo-400/40 text-[10px] font-semibold text-indigo-200 transition whitespace-nowrap"
                        title="Append Qwen 2.5 Coder 7B core skills to this workspace"
                      >
                        + Qwen 2.5
                      </button>
                      <button
                        type="button"
                        onClick={() => setSkillsModalOpen(true)}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-[10px] font-semibold text-slate-300 hover:text-white transition whitespace-nowrap tabular-nums"
                      >
                        Catalog ({availableSkills.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSelectedSkills(false)}
                        className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
                        title="Hide Selected Skills section"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {equippedSkillObjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 p-3 flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>
                        No skills selected in workspace{" "}
                        <strong className="text-slate-200 font-mono">
                          {projectId}
                        </strong>
                        .
                      </span>
                      <button
                        type="button"
                        onClick={handleEquipQwenPack}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold shrink-0 transition"
                      >
                        Equip Qwen 2.5 Coder Skills
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                      {equippedSkillObjects.map((sk, idx) => (
                        <div
                          key={sk.id}
                          className="rounded-xl bg-slate-900/80 border border-indigo-500/25 px-2.5 py-2 flex items-start justify-between gap-2 hover:border-indigo-400/50 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-mono text-indigo-400 font-bold">
                                #{idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-100 truncate">
                                {sk.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                                {sk.category}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300">
                                {sk.id}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              {sk.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickRemoveSkill(sk.id)}
                            className="p-1 rounded-lg bg-slate-950 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 shrink-0 transition"
                            title={`Remove ${sk.name} from workspace`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <FileTree />

            <AnimatePresence initial={false}>
              {showSteppedProgress && (
                <motion.div
                  key="stepped-progress-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 space-y-2 border-b border-slate-800"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Task Progress ({steps.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSteppedProgress(false)}
                      className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {steps.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 p-3 text-center text-xs text-slate-400">
                      No active build steps yet.
                    </div>
                  ) : (
                    steps.map((step) => (
                      <div
                        key={`${step.step_id}-${step.iteration}`}
                        className="bento-card-interactive rounded-xl p-2.5 flex items-start gap-2.5"
                      >
                        {renderStepIcon(step.status)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-200 truncate">
                              {step.title}
                            </p>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              #{step.iteration}
                            </span>
                          </div>
                          {step.detail && (
                            <p className="text-[11px] text-slate-400 mt-0.5 break-words">
                              {step.detail}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <TerminalStream />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
