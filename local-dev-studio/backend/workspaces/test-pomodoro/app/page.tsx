"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ITEMS = [
  {
    "id": "mod-1-apply",
    "name": "Apply Interactive Module",
    "category": "Module 01",
    "fps": "Live State",
    "stageType": "3d-card",
    "description": "Context-generated interactive view for 'Apply' updated via prompt: Apply 21.dev Bento Spotlight interactive template with ui-ux-pro-max-skill clean glassmorphic interface and mouse-tracking radial spotlight cards",
    "htmlCode": "<section class=\"module-apply\">\n  <h2>Apply Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-apply {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for Apply\nexport function initApply(state) {\n  console.log('Initialized Apply:', state);\n}"
  },
  {
    "id": "mod-2-21.dev",
    "name": "21.dev Interactive Module",
    "category": "Module 02",
    "fps": "Live State",
    "stageType": "3d-card",
    "description": "Context-generated interactive view for '21.dev' updated via prompt: Apply 21.dev Bento Spotlight interactive template with ui-ux-pro-max-skill clean glassmorphic interface and mouse-tracking radial spotlight cards",
    "htmlCode": "<section class=\"module-21.dev\">\n  <h2>21.dev Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-21.dev {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for 21.dev\nexport function init21.dev(state) {\n  console.log('Initialized 21.dev:', state);\n}"
  },
  {
    "id": "mod-3-bento",
    "name": "Bento Interactive Module",
    "category": "Module 03",
    "fps": "Live State",
    "stageType": "3d-card",
    "description": "Context-generated interactive view for 'Bento' updated via prompt: Apply 21.dev Bento Spotlight interactive template with ui-ux-pro-max-skill clean glassmorphic interface and mouse-tracking radial spotlight cards",
    "htmlCode": "<section class=\"module-bento\">\n  <h2>Bento Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-bento {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for Bento\nexport function initBento(state) {\n  console.log('Initialized Bento:', state);\n}"
  },
  {
    "id": "mod-4-spotlight",
    "name": "Spotlight Interactive Module",
    "category": "Module 04",
    "fps": "Live State",
    "stageType": "3d-card",
    "description": "Context-generated interactive view for 'Spotlight' updated via prompt: Apply 21.dev Bento Spotlight interactive template with ui-ux-pro-max-skill clean glassmorphic interface and mouse-tracking radial spotlight cards",
    "htmlCode": "<section class=\"module-spotlight\">\n  <h2>Spotlight Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-spotlight {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for Spotlight\nexport function initSpotlight(state) {\n  console.log('Initialized Spotlight:', state);\n}"
  },
  {
    "id": "mod-5-interactive",
    "name": "Interactive Interactive Module",
    "category": "Module 05",
    "fps": "Live State",
    "stageType": "3d-card",
    "description": "Context-generated interactive view for 'Interactive' updated via prompt: Apply 21.dev Bento Spotlight interactive template with ui-ux-pro-max-skill clean glassmorphic interface and mouse-tracking radial spotlight cards",
    "htmlCode": "<section class=\"module-interactive\">\n  <h2>Interactive Component</h2>\n  <p>Interactive state ready</p>\n</section>",
    "cssCode": ".module-interactive {\n  padding: 20px;\n  border-radius: 16px;\n  background: #0f172a;\n  border: 1px solid #334155;\n}",
    "jsCode": "// Controller for Interactive\nexport function initInteractive(state) {\n  console.log('Initialized Interactive:', state);\n}"
  }
];

export default function ContextGeneratedApp() {
  const [selectedId, setSelectedId] = useState<string>(ITEMS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCodeTab, setActiveCodeTab] = useState<"21dev" | "framer" | "html" | "css" | "js">("21dev");
  const [activeTemplate, setActiveTemplate] = useState<"bento" | "aurora" | "dock">("bento");
  const [speed, setSpeed] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  const filteredItems = ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const activeItem = ITEMS.find((item) => item.id === selectedId) || ITEMS[0];

  const twentyOneDevCode = `// 21st.dev (21.dev) Spotlight Bento Card + UI/UX Pro Max Skill
import React, { useState } from "react";
import { motion } from "framer-motion";

export function TwentyOneDev${activeItem.id.replace(/[^a-zA-Z0-9]/g, "")}Card() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <motion.div
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      style={{
        background: "radial-gradient(420px circle at " + pos.x + "px " + pos.y + "px, rgba(99,102,241,0.18), rgba(15,23,42,0.82) 70%)",
      }}
      className="relative rounded-2xl border border-white/10 p-6 backdrop-blur-xl shadow-2xl overflow-hidden"
    >
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
        21.dev &bull; ${activeItem.category}
      </span>
      <h3 className="text-xl font-extrabold text-white mt-2">${activeItem.name}</h3>
      <p className="text-xs text-slate-400 mt-1">${activeItem.description}</p>
    </motion.div>
  );
}`;

  const framerCode = `import { motion } from "framer-motion";

export function ${activeItem.id.replace(/[^a-zA-Z0-9]/g, "")}Motion() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -80, right: 80, top: -40, bottom: 40 }}
      dragElastic={0.22}
      whileHover={{ scale: 1.06, rotateX: 6, rotateY: -6 }}
      whileTap={{ scale: 0.94 }}
      initial={{ opacity: 0, y: 18, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 24 }}
      className="p-6 rounded-2xl bg-slate-900/90 border border-indigo-500/40 shadow-2xl cursor-grab active:cursor-grabbing"
    >
      <div className="text-xs font-bold text-indigo-400">${activeItem.category}</div>
      <div className="text-lg font-extrabold text-white mt-1">${activeItem.name}</div>
    </motion.div>
  );
}`;

  const codeContent =
    activeCodeTab === "21dev"
      ? twentyOneDevCode
      : activeCodeTab === "framer"
      ? framerCode
      : activeCodeTab === "html"
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
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xl"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                21.DEV INTERACTIVE TEMPLATE
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                UI/UX PRO MAX SKILL &bull; {ITEMS.length} TYPES
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">Apply 21.dev bento spotlight interactive template with ui-ux-pro-max</h1>
            <p className="text-xs text-slate-400 mt-1">Apply 21.dev Bento Spotlight interactive template with ui-ux-pro-max-skill clean glassmorphic interface and mouse-tracking radial spotlight cards</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(["bento", "aurora", "dock"] as const).map((tpl) => (
              <button
                key={tpl}
                onClick={() => setActiveTemplate(tpl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  activeTemplate === tpl
                    ? "bg-indigo-600 text-white border-indigo-400"
                    : "bg-slate-950/80 text-slate-400 border-white/10 hover:text-white"
                }`}
              >
                21.dev/{tpl}
              </button>
            ))}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs"
            >
              <option value={0.5}>0.5x Slow</option>
              <option value={1}>1.0x Normal</option>
              <option value={2}>2.0x Fast</option>
            </select>
          </div>
        </motion.header>

        <div className="grid md:grid-cols-12 gap-6">
          <aside className="md:col-span-4 space-y-2.5">
            <div className="text-xs font-bold uppercase text-slate-400">
              21.dev Interactive Catalog ({filteredItems.length} / {ITEMS.length})
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 21.dev components & animations..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-xs"
            />
            <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
              {filteredItems.map((item) => (
                <motion.button
                  layout
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition ${
                    item.id === selectedId
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-900/60 border-white/10 text-slate-300 hover:border-indigo-500/40"
                  }`}
                >
                  <div className="text-[11px] font-semibold text-indigo-400">{item.category}</div>
                  <div className="font-bold text-sm mt-0.5">{item.name}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</div>
                </motion.button>
              ))}
            </div>
          </aside>

          <section className="md:col-span-8 space-y-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
                className="rounded-2xl bg-slate-900/75 backdrop-blur-xl border border-white/10 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{activeItem.name}</h2>
                    <p className="text-xs text-slate-400">{activeItem.description}</p>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {activeItem.fps}
                  </span>
                </div>
                <div className="h-56 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center overflow-hidden">
                  <motion.div
                    drag
                    dragConstraints={{ left: -100, right: 100, top: -45, bottom: 45 }}
                    dragElastic={0.24}
                    whileHover={{ scale: 1.07, rotate: 2 }}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: "spring", stiffness: 340, damping: 22 }}
                    className="px-6 py-4 rounded-2xl bg-indigo-600/25 border border-indigo-400/50 text-center cursor-grab active:cursor-grabbing select-none shadow-xl"
                  >
                    <div className="text-[10px] font-mono uppercase text-indigo-300">
                      21.dev/{activeTemplate} &bull; Drag &amp; Spring Stage
                    </div>
                    <div className="text-base font-extrabold text-white mt-1">{activeItem.name}</div>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-950/60">
                <div className="flex gap-1.5 flex-wrap">
                  {(["21dev", "framer", "html", "css", "js"] as const).map((tab) => (
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      key={tab}
                      onClick={() => setActiveCodeTab(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono uppercase ${
                        activeCodeTab === tab
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab === "21dev"
                        ? "21.dev Template"
                        : tab === "framer"
                        ? "Framer Motion"
                        : tab === "html"
                        ? "HTML5 Markup"
                        : tab === "css"
                        ? "CSS3 Keyframes"
                        : "JS Controller"}
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyCode}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                >
                  {copied ? "✓ Copied" : "Copy Sample Code"}
                </motion.button>
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
