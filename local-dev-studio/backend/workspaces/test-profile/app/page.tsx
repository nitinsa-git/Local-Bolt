"use client";
import React, { useState } from "react";

const PROJECTS = [
  {
    id: 1,
    title: "Nebula Design System",
    category: "Design Systems",
    impact: "Adopted by 42 product teams, cutting UI delivery time by 58%",
    stack: ["Figma Tokens", "React 19", "Tailwind", "WCAG AAA"],
  },
  {
    id: 2,
    title: "Pulse Fintech Spatial Checkout",
    category: "Product UX",
    impact: "+34% conversion lift across 4.2M monthly active users",
    stack: ["Framer Motion", "Next.js 15", "User Research", "A/B Testing"],
  },
  {
    id: 3,
    title: "Aether AI Studio Canvas",
    category: "AI / Interaction",
    impact: "Red Dot Award winner for human-centered generative workflows",
    stack: ["Canvas WebGL", "TypeScript", "Micro-interactions"],
  },
];

const TIMELINE = [
  { period: "2021 — Present", role: "Principal UI/UX Architect", company: "Vercel / Linear Partner Studio", highlight: "Leading multi-platform design systems & frontend architecture." },
  { period: "2016 — 2021", role: "Staff Product Designer & UX Engineer", company: "Stripe Core Experience", highlight: "Redesigned global checkout & merchant analytics suite." },
  { period: "2011 — 2016", role: "Senior Interaction Designer", company: "IDEO Digital Lab", highlight: "Shipped 25+ flagship web & mobile products from 0 to 1." },
];

export default function DeveloperProfileOnePager() {
  const [filter, setFilter] = useState<string>("All");
  const [contactSent, setContactSent] = useState<boolean>(false);

  const filtered = filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300">
            AVAILABLE FOR PRINCIPAL / ADVISORY ROLES &bull; 15+ YEARS EXPERIENCE
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mt-4 tracking-tight">Alex Rivera</h1>
          <p className="text-indigo-400 font-semibold text-lg mt-1">Principal UI/UX & Design Systems Architect</p>
          <p className="text-slate-400 text-sm mt-3 max-w-2xl">
            Crafting high-craft interfaces, accessible design systems, and zero-latency web applications for 15 years. Bridging user research, interaction design, and production React architecture.
          </p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-2xl font-black text-indigo-400">15+ yrs</div>
            <div className="text-xs text-slate-400">UI/UX & Frontend Mastery</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-2xl font-black text-emerald-400">60+</div>
            <div className="text-xs text-slate-400">Products Shipped</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-2xl font-black text-amber-400">99.8%</div>
            <div className="text-xs text-slate-400">WCAG Accessibility Score</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-2xl font-black text-pink-400">14M+</div>
            <div className="text-xs text-slate-400">Daily End-Users Reached</div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Featured Case Studies</h2>
            <div className="flex gap-2">
              {["All", "Design Systems", "Product UX", "AI / Interaction"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${filter === cat ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[11px] text-indigo-400 font-semibold">{item.category}</span>
                <h3 className="font-bold text-base">{item.title}</h3>
                <p className="text-xs text-slate-400">{item.impact}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">Career Timeline (15 Years)</h2>
          {TIMELINE.map((t, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="font-bold text-sm">{t.role} &bull; <span className="text-indigo-400">{t.company}</span></div>
                <div className="text-xs text-slate-400">{t.highlight}</div>
              </div>
              <span className="text-xs font-mono text-slate-500">{t.period}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
