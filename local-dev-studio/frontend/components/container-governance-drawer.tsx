"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Cpu,
  HardDrive,
  Plus,
  RefreshCcw,
  Save,
  Server,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { BACKEND_HTTP, useStudioStore } from "@/lib/store";

interface CuriousLLMConfig {
  enabled: boolean;
  engine?: string;
  reasoning_mode?: string;
  reasoning_hops: number;
  preferred_model: string;
  total_ram_gb?: number;
  avail_ram_gb?: number;
  swap_total_gb?: number;
  effective_memory_gb?: number;
  max_feasible_tier?: string;
  kv_cache_quant: string;
  flash_attention: boolean;
  mmap_streaming: boolean;
  ctx_size: number;
}

export function ContainerGovernanceDrawer() {
  const {
    projectId,
    governanceOpen,
    setGovernanceOpen,
    containerStats,
    setContainerStats,
    bumpPreviewRefresh,
    appendConsoleLog,
  } = useStudioStore();

  const [envPairs, setEnvPairs] = useState<Array<{ key: string; value: string }>>([
    { key: "NODE_ENV", value: "development" },
    { key: "PORT", value: "3000" },
    { key: "SANDBOX_MODE", value: "hybrid_isolated" },
    { key: "AI_PROVIDER", value: "auto" },
    { key: "LOCAL_LLM_MODEL", value: "qwen2.5-coder:7b" },
    { key: "OLLAMA_HOST", value: "http://127.0.0.1:11434" },
  ]);
  const [restarting, setRestarting] = useState(false);
  const [savingEnv, setSavingEnv] = useState(false);
  const [savingCurious, setSavingCurious] = useState(false);
  const [serverActiveModel, setServerActiveModel] = useState<string>("qwen2.5-coder:7b");
  const [serverEndpoint, setServerEndpoint] = useState<string>("http://127.0.0.1:11434");
  const [curiousConfig, setCuriousConfig] = useState<CuriousLLMConfig>({
    enabled: true,
    reasoning_hops: 3,
    preferred_model: "auto",
    total_ram_gb: 8.0,
    avail_ram_gb: 6.0,
    swap_total_gb: 4.0,
    effective_memory_gb: 10.6,
    max_feasible_tier: "14B (Q4_K_M) / 7B-8B (Q8_0)",
    kv_cache_quant: "q8_0",
    flash_attention: true,
    mmap_streaming: true,
    ctx_size: 8192,
  });

  const upsertEnvVar = (key: string, value: string) => {
    setEnvPairs((prev) => {
      const idx = prev.findIndex((p) => p.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { key, value };
        return next;
      }
      return [...prev, { key, value }];
    });
  };

  const loadGovernance = async () => {
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/container`);
      if (res.ok) {
        const stats = await res.json();
        setContainerStats(stats);
        if (stats.env_vars) {
          setEnvPairs(
            Object.entries(stats.env_vars).map(([key, value]) => ({
              key,
              value: String(value),
            }))
          );
        }
      }
      const llmRes = await fetch(`${BACKEND_HTTP}/api/llm/status`);
      if (llmRes.ok) {
        const llmData = await llmRes.json();
        if (llmData.model) setServerActiveModel(String(llmData.model));
        if (llmData.endpoint) setServerEndpoint(String(llmData.endpoint));
        if (llmData.curious_llm) {
          setCuriousConfig((prev) => ({
            ...prev,
            ...llmData.curious_llm,
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to load container governance:", e);
    }
  };

  const handleSaveCuriousGovernance = async () => {
    setSavingCurious(true);
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/llm/curious-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: curiousConfig.enabled,
          preferred_model:
            curiousConfig.preferred_model === "auto"
              ? ""
              : curiousConfig.preferred_model,
          kv_cache_quant: curiousConfig.kv_cache_quant,
          ctx_size: Number(curiousConfig.ctx_size) || 8192,
          flash_attention: curiousConfig.flash_attention,
          mmap_streaming: curiousConfig.mmap_streaming,
          reasoning_hops: Number(curiousConfig.reasoning_hops) || 3,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        if (updated.model) setServerActiveModel(String(updated.model));
        if (updated.curious_llm) {
          setCuriousConfig((prev) => ({ ...prev, ...updated.curious_llm }));
        }
        appendConsoleLog(
          `[Core Governance] Applied CuriousLLM Server Config (enabled=${curiousConfig.enabled}, model=${curiousConfig.preferred_model}, kv=${curiousConfig.kv_cache_quant}, ctx=${curiousConfig.ctx_size})`
        );
      }
    } finally {
      setSavingCurious(false);
    }
  };

  useEffect(() => {
    if (governanceOpen) {
      loadGovernance();
    }
  }, [governanceOpen, projectId]);

  const handleRestartServer = async () => {
    setRestarting(true);
    try {
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${projectId}/container/restart`,
        { method: "POST" }
      );
      if (res.ok) {
        appendConsoleLog("[Governance] Restarted Vite/Next dev server inside container.");
        bumpPreviewRefresh();
        await loadGovernance();
      }
    } finally {
      setRestarting(false);
    }
  };

  const handleSaveEnv = async () => {
    setSavingEnv(true);
    try {
      const envMap: Record<string, string> = {};
      envPairs.forEach((p) => {
        if (p.key.trim()) envMap[p.key.trim()] = p.value;
      });
      const res = await fetch(
        `${BACKEND_HTTP}/api/projects/${projectId}/container/env`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ env_vars: envMap }),
        }
      );
      if (res.ok) {
        appendConsoleLog("[Governance] Updated workspace .env configuration.");
        await loadGovernance();
      }
    } finally {
      setSavingEnv(false);
    }
  };

  const memUsage = containerStats?.memory_usage_mb ?? 164.8;
  const memLimit = containerStats?.memory_limit_mb ?? 2048.0;
  const memPct = Math.min(100, Math.round((memUsage / memLimit) * 100));

  return (
    <AnimatePresence>
      {governanceOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
        >
          <motion.div
            initial={{ x: 460 }}
            animate={{ x: 0 }}
            exit={{ x: 460 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="w-[460px] bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Container Governance & Sandbox Telemetry
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bounded Micro-Container (`mem_limit=2g`, `nano_cpus=2B`)
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setGovernanceOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Core Server Governance: CuriousLLM & Higher-LLM Execution Engine */}
          <div className="rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-indigo-950/35 via-slate-900/70 to-slate-950 p-4 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100">
                      CuriousLLM • Higher-LLM Server Governance
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                      CORE ENGINE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Multi-hop curiosity reasoning &amp; KV-quantized higher-LLM scaling
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCuriousConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
                }
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                  curiousConfig.enabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                    : "bg-slate-900 text-slate-400 border-slate-700"
                }`}
              >
                {curiousConfig.enabled ? "● Active" : "○ Disabled"}
              </button>
            </div>

            {/* Host Server Memory & Feasible Higher-LLM Tier Telemetry */}
            <div className="rounded-xl bg-slate-950/85 border border-white/[0.07] p-2.5 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Host RAM + Swap Pool</span>
                <span className="font-mono text-slate-200 tabular-nums">
                  {curiousConfig.total_ram_gb ?? 8} GB RAM +{" "}
                  {curiousConfig.swap_total_gb ?? 4} GB Swap (
                  {curiousConfig.effective_memory_gb ?? 10.6} GB eff.)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Max Feasible Local Tier</span>
                <span className="font-mono font-semibold text-emerald-300">
                  {curiousConfig.max_feasible_tier || "14B / 7B-8B"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Server Model</span>
                <span className="font-mono text-indigo-300 truncate max-w-[210px]">
                  {serverActiveModel} ({serverEndpoint.replace(/^https?:\/\//, "")})
                </span>
              </div>
            </div>

            {/* Higher-LLM Target Model Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Target Higher Local LLM Model (Server-Wide)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "auto", label: "⚡ Auto Highest" },
                  { id: "qwen2.5-coder:32b", label: "Qwen2.5-Coder 32B" },
                  { id: "qwen2.5-coder:14b", label: "Qwen2.5-Coder 14B" },
                  { id: "deepseek-r1:14b", label: "DeepSeek-R1 14B" },
                  { id: "deepseek-r1:8b", label: "DeepSeek-R1 8B" },
                  { id: "qwq:32b", label: "QwQ 32B" },
                  { id: "qwen2.5-coder:7b", label: "Qwen2.5-Coder 7B" },
                ].map((m) => {
                  const selected =
                    (curiousConfig.preferred_model || "auto") === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setCuriousConfig((prev) => ({
                          ...prev,
                          preferred_model: m.id,
                        }))
                      }
                      className={`px-2 py-1 rounded-lg border text-[10px] font-semibold transition ${
                        selected
                          ? "bg-indigo-500/30 border-indigo-400/60 text-white"
                          : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KV-Cache Quantization, Context Window & Curiosity Hops */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block">
                  KV-Cache Quant
                </label>
                <select
                  value={curiousConfig.kv_cache_quant}
                  onChange={(e) =>
                    setCuriousConfig((prev) => ({
                      ...prev,
                      kv_cache_quant: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs font-mono text-slate-200"
                >
                  <option value="q4_0">q4_0 (Max 32B/14B)</option>
                  <option value="q8_0">q8_0 (Balanced)</option>
                  <option value="f16">f16 (Full FP16)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block">
                  Context Window
                </label>
                <select
                  value={curiousConfig.ctx_size}
                  onChange={(e) =>
                    setCuriousConfig((prev) => ({
                      ...prev,
                      ctx_size: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs font-mono text-slate-200"
                >
                  <option value={6144}>6,144 tokens</option>
                  <option value={8192}>8,192 tokens</option>
                  <option value={12288}>12,288 tokens</option>
                  <option value={16384}>16,384 tokens</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block">
                  Curiosity Hops
                </label>
                <select
                  value={curiousConfig.reasoning_hops}
                  onChange={(e) =>
                    setCuriousConfig((prev) => ({
                      ...prev,
                      reasoning_hops: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-2 py-1.5 text-xs font-mono text-slate-200"
                >
                  <option value={1}>1 Hop (Fast)</option>
                  <option value={2}>2 Hops</option>
                  <option value={3}>3 Hops (Default)</option>
                  <option value={4}>4 Hops (Deep)</option>
                </select>
              </div>
            </div>

            {/* Flash Attention & mmap Layer Streaming Toggles */}
            <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={curiousConfig.flash_attention}
                  onChange={(e) =>
                    setCuriousConfig((prev) => ({
                      ...prev,
                      flash_attention: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500"
                />
                <span>Flash Attention (`-fa`)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={curiousConfig.mmap_streaming}
                  onChange={(e) =>
                    setCuriousConfig((prev) => ({
                      ...prev,
                      mmap_streaming: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500"
                />
                <span>`--mmap` Swap Layer Stream</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleSaveCuriousGovernance}
              disabled={savingCurious}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {savingCurious
                  ? "Applying CuriousLLM Server Governance..."
                  : "Apply CuriousLLM & Higher-LLM Server Config"}
              </span>
            </button>
          </div>

          {/* Active Container Metadata */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Server className="w-4 h-4 text-indigo-400" />
                Container ID: {containerStats?.container_id || "studio-sandbox-default"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {containerStats?.status || "running"}
              </span>
            </div>

            {/* Memory Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                  Active Memory Allocation
                </span>
                <span className="font-mono text-slate-200">
                  {memUsage} MB / {memLimit} MB ({memPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${Math.max(8, memPct)}%` }}
                />
              </div>
            </div>

            {/* CPU Telemetry */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                CPU Utilization (2.0 vCPU quota)
              </span>
              <span className="font-mono text-emerald-300">
                {containerStats?.cpu_percent ?? 2.4}%
              </span>
            </div>
          </div>

          {/* Dev Server Lifecycle Actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Vite / Next.js Dev Server Lifecycle</span>
            </div>
            <p className="text-xs text-slate-400">
              Restart the exposed preview server process inside the isolated container if hot-reload stalls.
            </p>
            <button
              type="button"
              onClick={handleRestartServer}
              disabled={restarting}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${restarting ? "animate-spin" : ""}`} />
              <span>
                {restarting
                  ? "Restarting Container Dev Server..."
                  : "Restart Vite / Next.js Dev Server"}
              </span>
            </button>
          </div>

          {/* .env Variable Editor */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Workspace `.env` AI Model &amp; Sandbox Config
              </span>
              <button
                type="button"
                onClick={() =>
                  setEnvPairs([...envPairs, { key: "NEW_VAR", value: "value" }])
                }
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variable</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  upsertEnvVar("AI_PROVIDER", "ollama");
                  upsertEnvVar("LOCAL_LLM_MODEL", "qwen2.5-coder:7b");
                }}
                className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/35 text-[10px] font-semibold text-indigo-200 transition"
              >
                Model: Qwen2.5-7B
              </button>
              <button
                type="button"
                onClick={() => {
                  upsertEnvVar("AI_PROVIDER", "ollama");
                  upsertEnvVar("LOCAL_LLM_MODEL", "qwen2.5-coder:3b");
                }}
                className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/35 text-[10px] font-semibold text-indigo-200 transition"
              >
                Model: Qwen2.5-3B
              </button>
              <button
                type="button"
                onClick={() => {
                  upsertEnvVar("AI_PROVIDER", "ollama");
                  upsertEnvVar("LOCAL_LLM_MODEL", "qwen3.5:2b");
                }}
                className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/35 text-[10px] font-semibold text-indigo-200 transition"
              >
                Model: Qwen3.5-2B
              </button>
              <button
                type="button"
                onClick={() => upsertEnvVar("SANDBOX_MODE", "hybrid_isolated")}
                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-[10px] font-semibold text-emerald-200 transition"
              >
                Mode: Hybrid Isolated
              </button>
              <button
                type="button"
                onClick={() => upsertEnvVar("SANDBOX_MODE", "docker")}
                className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/35 text-[10px] font-semibold text-amber-200 transition"
              >
                Mode: Docker Container
              </button>
            </div>

            <div className="space-y-2">
              {envPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => {
                      const next = [...envPairs];
                      next[idx].key = e.target.value;
                      setEnvPairs(next);
                    }}
                    placeholder="KEY"
                    className="w-2/5 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-slate-200"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => {
                      const next = [...envPairs];
                      next[idx].value = e.target.value;
                      setEnvPairs(next);
                    }}
                    placeholder="VALUE"
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleSaveEnv}
              disabled={savingEnv}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingEnv ? "Applying .env..." : "Save & Apply .env Variables"}</span>
            </motion.button>
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
