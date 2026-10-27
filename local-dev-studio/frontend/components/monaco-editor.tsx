"use client";

import React, { useState } from "react";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { Code2, EyeOff, GitCompare, Save, X } from "lucide-react";
import { BACKEND_HTTP, useStudioStore } from "@/lib/store";

export function MonacoEditorPane() {
  const {
    projectId,
    themeTone,
    files,
    activeFilePath,
    openTabs,
    showDiffView,
    setActiveFilePath,
    closeTab,
    setShowDiffView,
    setShowEditor,
    upsertFileDiff,
    bumpPreviewRefresh,
    appendConsoleLog,
  } = useStudioStore();

  const [saving, setSaving] = useState(false);
  const isLightTheme =
    themeTone === "alabaster-light" || themeTone === "warm-ivory";
  const monacoTheme = isLightTheme ? "light" : "vs-dark";

  const activeFile = files.find((f) => f.path === activeFilePath) || {
    path: activeFilePath || "app/page.tsx",
    content: "// Select or generate a file in the workspace",
    original_content: "",
    size: 0,
  };

  const detectLanguage = (path: string) => {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) return "typescript";
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".css")) return "css";
    return "plaintext";
  };

  const handleSave = async () => {
    if (!activeFile.path) return;
    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_HTTP}/api/projects/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: activeFile.path,
          content: activeFile.content,
        }),
      });
      if (res.ok) {
        appendConsoleLog(`[Editor] Saved ${activeFile.path} to sandbox workspace`);
        bumpPreviewRefresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-slate-950 border-r border-slate-800 min-w-0 h-full">
      {/* Top Tab Bar & Diff Toggle */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-2 h-10 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {openTabs.map((tabPath) => {
            const active = tabPath === activeFilePath;
            return (
              <div
                key={tabPath}
                onClick={() => setActiveFilePath(tabPath)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer border-b-2 transition ${
                  active
                    ? "bg-slate-950 text-indigo-300 border-indigo-500"
                    : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate max-w-[140px]">{tabPath}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabPath);
                  }}
                  className="opacity-60 hover:opacity-100 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowDiffView(!showDiffView)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition ${
              showDiffView
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>{showDiffView ? "Side-by-Side Diff" : "Standard Editor"}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEditor(false)}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Hide Editor Pane (Expand Live Preview)"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div
        className={`flex-1 relative ${
          isLightTheme ? "bg-white" : "bg-[#1e1e1e]"
        }`}
      >
        {showDiffView ? (
          <DiffEditor
            height="100%"
            theme={monacoTheme}
            language={detectLanguage(activeFile.path)}
            original={activeFile.original_content || "// Empty prior version"}
            modified={activeFile.content}
            keepCurrentOriginalModel={true}
            keepCurrentModifiedModel={true}
            options={{
              renderSideBySide: true,
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <Editor
            height="100%"
            theme={monacoTheme}
            language={detectLanguage(activeFile.path)}
            value={activeFile.content}
            onChange={(val) => {
              if (typeof val === "string") {
                upsertFileDiff(
                  activeFile.path,
                  val,
                  activeFile.original_content
                );
              }
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        )}
      </div>
    </section>
  );
}
