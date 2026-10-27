"use client";
import React, { useState, useEffect, useRef } from "react";

export default function PomodoroApp() {
  const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedSessions, setCompletedSessions] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const durations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

  const playAudioAlert = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current || new Ctx();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Audio alert skipped:", e);
    }
  };

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          playAudioAlert();
          setIsRunning(false);
          setCompletedSessions((s) => s + 1);
          return durations[mode];
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, mode]);

  const switchMode = (nextMode: "focus" | "short" | "long") => {
    setIsRunning(false);
    setMode(nextMode);
    setSecondsLeft(durations[nextMode]);
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2">Pomodoro Focus Timer</h1>
        <p className="text-slate-400 text-center text-sm mb-6">Web Audio API synthesized alerts</p>
        <div className="flex gap-2 justify-center mb-8">
          {(["focus", "short", "long"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                mode === m ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="text-7xl font-mono font-extrabold text-center tracking-tight my-8 text-indigo-400">
          {mm}:{ss}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold"
          >
            {isRunning ? "Pause" : "Start Focus"}
          </button>
          <button
            onClick={playAudioAlert}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Test Audio
          </button>
        </div>
        <div className="mt-6 text-center text-xs text-slate-400">
          Completed Sessions: {completedSessions}
        </div>
      </div>
    </main>
  );
}
