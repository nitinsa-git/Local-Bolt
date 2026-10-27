"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  EyeOff,
  Send,
  Terminal as TerminalIcon,
} from "lucide-react";
import { BACKEND_WS, useStudioStore } from "@/lib/store";
import type { Terminal as XTermType } from "@xterm/xterm";

export function TerminalStream() {
  const {
    projectId,
    themeTone,
    appendConsoleLog,
    showSandboxShell,
    setShowSandboxShell,
  } = useStudioStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<XTermType | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [commandInput, setCommandInput] = useState("");
  const [connected, setConnected] = useState(false);

  const isLightTheme =
    themeTone === "alabaster-light" || themeTone === "warm-ivory";

  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.theme = isLightTheme
        ? {
            background: "#f8fafc",
            foreground: "#0f172a",
            cursor: "#4f46e5",
          }
        : {
            background: "#020617",
            foreground: "#e2e8f0",
            cursor: "#6366f1",
          };
    }
  }, [isLightTheme]);

  useEffect(() => {
    if (!showSandboxShell) return;
    let disposed = false;

    async function initTerminal() {
      if (!containerRef.current) return;
      const { Terminal } = await import("@xterm/xterm");
      if (disposed || !containerRef.current) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 12,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        theme: isLightTheme
          ? {
              background: "#f8fafc",
              foreground: "#0f172a",
              cursor: "#4f46e5",
            }
          : {
              background: "#020617",
              foreground: "#e2e8f0",
              cursor: "#6366f1",
            },
        rows: 11,
        convertEol: true,
      });

      containerRef.current.innerHTML = "";
      term.open(containerRef.current);
      term.writeln(
        "\x1b[1;34m[Xterm.js]\x1b[0m Connecting to container shell stream..."
      );
      termRef.current = term;

      const ws = new WebSocket(`${BACKEND_WS}/ws/terminal/${projectId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed) setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "output" && msg.data) {
            term.write(msg.data);
            const clean = String(msg.data)
              .replace(/\x1b\[[0-9;]*m/g, "")
              .trim();
            if (clean) appendConsoleLog(`[Shell] ${clean.slice(0, 140)}`);
          }
        } catch {
          term.write(String(event.data));
        }
      };

      ws.onerror = () => {
        if (!disposed) setConnected(false);
      };

      ws.onclose = () => {
        if (!disposed) setConnected(false);
      };
    }

    initTerminal();

    return () => {
      disposed = true;
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
      if (termRef.current) {
        try {
          termRef.current.dispose();
        } catch {
          // ignore disposal during unmount
        }
        termRef.current = null;
      }
    };
  }, [projectId, showSandboxShell, appendConsoleLog]);

  const sendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !commandInput.trim() ||
      !wsRef.current ||
      wsRef.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    wsRef.current.send(JSON.stringify({ command: commandInput }));
    setCommandInput("");
  };

  return (
    <AnimatePresence initial={false}>
      {showSandboxShell && (
        <motion.div
          key="sandbox-shell-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 240 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="flex flex-col border-t border-slate-800 bg-slate-950 h-60 shrink-0 overflow-hidden"
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/70">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sandbox Shell Stream (Xterm.js)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  connected
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {connected ? "WS Live" : "Connecting"}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setShowSandboxShell(false)}
                className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                title="Hide Sandbox Shell Stream"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex-1 overflow-hidden p-2 bg-slate-950"
          />

          <form
            onSubmit={sendCommand}
            className="flex items-center gap-1.5 px-2 py-1.5 border-t border-slate-800 bg-slate-900/50"
          >
            <span className="text-xs font-mono text-indigo-400 pl-1">$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Run command in sandbox container (e.g., ls -la, npm test)..."
              className="flex-1 bg-transparent text-xs font-mono text-slate-200 focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="submit"
              className="p-1 rounded bg-indigo-600/80 hover:bg-indigo-500 text-white transition"
              title="Execute Command"
            >
              <Send className="w-3 h-3" />
            </motion.button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
