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
  X,
} from "lucide-react";
import { BACKEND_HTTP, useStudioStore } from "@/lib/store";

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
    } catch (e) {
      console.warn("Failed to load container governance:", e);
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
