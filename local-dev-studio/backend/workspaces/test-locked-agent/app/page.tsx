"use client";
import React, { useState } from "react";

const ITEMS = [
  {
    "id": "mod-1",
    "name": "Dark Interactive Module",
    "category": "Module 01",
    "fps": "Live State",
    "description": "Context-generated interactive view for 'Dark' derived from prompt: Add dark mode and CSV export to the latency monitor",
    "animationClass": "anim-tilt",
    "htmlCode": "<section class=\"module-dark\">\n  <h2>Dark Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-dark {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for Dark\nexport function initDark(state) {\n  console.log('Initialized Dark:', state);\n}"
  },
  {
    "id": "mod-2",
    "name": "Mode Interactive Module",
    "category": "Module 02",
    "fps": "Live State",
    "description": "Context-generated interactive view for 'Mode' derived from prompt: Add dark mode and CSV export to the latency monitor",
    "animationClass": "anim-tilt",
    "htmlCode": "<section class=\"module-mode\">\n  <h2>Mode Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-mode {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for Mode\nexport function initMode(state) {\n  console.log('Initialized Mode:', state);\n}"
  },
  {
    "id": "mod-3",
    "name": "Export Interactive Module",
    "category": "Module 03",
    "fps": "Live State",
    "description": "Context-generated interactive view for 'Export' derived from prompt: Add dark mode and CSV export to the latency monitor",
    "animationClass": "anim-tilt",
    "htmlCode": "<section class=\"module-export\">\n  <h2>Export Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-export {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for Export\nexport function initExport(state) {\n  console.log('Initialized Export:', state);\n}"
  },
  {
    "id": "mod-4",
    "name": "Latency Interactive Module",
    "category": "Module 04",
    "fps": "Live State",
    "description": "Context-generated interactive view for 'Latency' derived from prompt: Add dark mode and CSV export to the latency monitor",
    "animationClass": "anim-tilt",
    "htmlCode": "<section class=\"module-latency\">\n  <h2>Latency Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-latency {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for Latency\nexport function initLatency(state) {\n  console.log('Initialized Latency:', state);\n}"
  }
];

export default function ContextGeneratedApp() {
  const [selectedId, setSelectedId] = useState<string>(ITEMS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCodeTab, setActiveCodeTab] = useState<"html" | "css" | "js">("html");
  const [speed, setSpeed] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  const filteredItems = ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeItem = ITEMS.find((item) => item.id === selectedId) || ITEMS[0];
  const codeContent =
    activeCodeTab === "html"
      ? activeItem.htmlCode
      : activeCodeTab === "css"
      ? activeItem.cssCode
      : activeItem.jsCode;

  const copyCode = () => {
    navigator.clipboard?.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              CONTEXT-AWARE STUDIO BUILD &bull; NEXTJS &bull; {ITEMS.length} TYPES
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Add dark mode and csv export to the latency monitor</h1>
            <p className="text-xs text-slate-400 mt-1">Build an interactive API latency monitor dashboard</p>
            <p className="text-xs text-emerald-400 mt-1">Latest Update: Add dark mode and CSV export to the latency monitor</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Speed:</label>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs"
            >
              <option value={0.5}>0.5x Slow Motion</option>
              <option value={1}>1.0x Normal</option>
              <option value={2}>2.0x Fast</option>
            </select>
          </div>
        </header>

        <div className="grid md:grid-cols-12 gap-6">
          <aside className="md:col-span-4 space-y-2.5">
            <div className="text-xs font-bold uppercase text-slate-400">
              Select Animation / UI Type ({filteredItems.length} / {ITEMS.length})
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter animations..."
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
            />
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition ${
                    item.id === selectedId
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="text-[11px] font-semibold text-indigo-400">{item.category}</div>
                  <div className="font-bold text-sm mt-0.5">{item.name}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="md:col-span-8 space-y-5">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">{activeItem.name}</h2>
                  <p className="text-xs text-slate-400">{activeItem.description}</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300">
                  {activeItem.fps}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex gap-1.5">
                  {(["html", "css", "js"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveCodeTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono uppercase ${
                        activeCodeTab === tab
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab === "html" ? "HTML5 Markup" : tab === "css" ? "CSS3 Keyframes" : "JS Controller"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={copyCode}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
                >
                  {copied ? "✓ Copied" : "Copy Sample Code"}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed">
                <code>{codeContent}</code>
              </pre>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
