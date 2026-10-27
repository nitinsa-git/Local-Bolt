"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EyeOff,
  FileCode,
  FileJson,
  FileText,
  FolderOpen,
} from "lucide-react";
import { useStudioStore } from "@/lib/store";

export function FileTree() {
  const {
    files,
    activeFilePath,
    setActiveFilePath,
    setShowEditor,
    showWorkspaceFiles,
    setShowWorkspaceFiles,
  } = useStudioStore();

  const getIcon = (path: string) => {
    if (path.endsWith(".json"))
      return <FileJson className="w-3.5 h-3.5 text-amber-400" />;
    if (path.endsWith(".tsx") || path.endsWith(".ts") || path.endsWith(".js"))
      return <FileCode className="w-3.5 h-3.5 text-indigo-400" />;
    return <FileText className="w-3.5 h-3.5 text-emerald-400" />;
  };

  return (
    <AnimatePresence initial={false}>
      {showWorkspaceFiles && (
        <motion.div
          key="workspace-files-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="border-b border-slate-800 bg-slate-950/60 p-2.5 shrink-0 overflow-hidden"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Workspace Files ({files.length})</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setShowWorkspaceFiles(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Hide Workspace Files"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {files.length === 0 ? (
              <div className="text-xs text-slate-500 px-2 py-1">
                No files generated yet
              </div>
            ) : (
              files.map((file, idx) => {
                const isActive = file.path === activeFilePath;
                return (
                  <motion.button
                    key={file.path}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveFilePath(file.path);
                      setShowEditor(true);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition ${
                      isActive
                        ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30"
                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {getIcon(file.path)}
                      <span className="truncate font-mono">{file.path}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{file.size}B</span>
                  </motion.button>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

