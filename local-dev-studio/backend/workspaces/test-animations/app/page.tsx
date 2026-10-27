"use client";
import React, { useState } from "react";

const ITEMS = [
  {
    "id": "morph-card",
    "name": "3D Glassmorphic Tilt & Glow",
    "category": "HTML5 / CSS3 3D Transform",
    "fps": "60 FPS Hardware Accelerated",
    "description": "Interactive perspective card with specular radial highlight, spring easing, and layered depth shadows.",
    "animationClass": "anim-tilt",
    "htmlCode": "<div class=\"ux-card-3d\">\n  <div class=\"ux-glow\"></div>\n  <h3>HTML5 3D Perspective</h3>\n  <p>Hover or trigger keyframes</p>\n</div>",
    "cssCode": ".ux-card-3d {\n  transform-style: preserve-3d;\n  animation: float3d 3.2s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;\n  background: linear-gradient(135deg, rgba(99,102,241,0.28), rgba(15,23,42,0.9));\n  border: 1px solid rgba(129,140,248,0.45);\n  border-radius: 20px;\n  box-shadow: 0 25px 50px -12px rgba(79,70,229,0.45);\n}\n@keyframes float3d {\n  0% { transform: perspective(800px) rotateX(0deg) rotateY(-8deg) translateY(0px); }\n  100% { transform: perspective(800px) rotateX(8deg) rotateY(10deg) translateY(-14px); }\n}",
    "jsCode": "// Web Animations API Controller\nconst el = document.querySelector('.ux-card-3d');\nel.animate([\n  { transform: 'perspective(800px) rotateY(-8deg) scale(0.96)' },\n  { transform: 'perspective(800px) rotateY(8deg) scale(1.04)' }\n], { duration: 1800, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });",
    "stageType": "3d-card"
  },
  {
    "id": "elastic-pulse",
    "name": "Elastic Spring Micro-Interaction",
    "category": "Keyframes & Spring Physics",
    "fps": "120Hz ProMotion Ready",
    "description": "Multi-stage elastic bounce and ripple wave propagation for interactive CTA buttons and status indicators.",
    "animationClass": "anim-elastic",
    "htmlCode": "<button class=\"ux-elastic-btn\">\n  <span class=\"pulse-ring\"></span>\n  <span class=\"label\">Trigger Elastic Action</span>\n</button>",
    "cssCode": "@keyframes elasticBounce {\n  0% { transform: scale(0.85); }\n  40% { transform: scale(1.12); }\n  70% { transform: scale(0.95); }\n  100% { transform: scale(1); }\n}\n.ux-elastic-btn {\n  animation: elasticBounce 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;\n}",
    "jsCode": "// Spring Physics Impulse\nfunction triggerElastic(target) {\n  target.style.animation = 'none';\n  target.offsetHeight; // reflow\n  target.style.animation = 'elasticBounce 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)';\n}",
    "stageType": "elastic"
  },
  {
    "id": "svg-path-morph",
    "name": "HTML5 SVG Stroke & Path Morphing",
    "category": "SVG Vector Animation",
    "fps": "Zero-Layout-Shift Vector",
    "description": "Synchronized stroke-dasharray drawing and gradient stop morphing for onboarding and telemetry icons.",
    "animationClass": "anim-svg",
    "htmlCode": "<svg viewBox=\"0 0 120 120\" class=\"ux-svg-morph\">\n  <circle cx=\"60\" cy=\"60\" r=\"46\" stroke=\"url(#grad)\" stroke-width=\"6\" fill=\"none\" />\n  <path d=\"M38 62 L54 76 L84 44\" stroke=\"#34d399\" stroke-width=\"6\" fill=\"none\" />\n</svg>",
    "cssCode": ".ux-svg-morph circle {\n  stroke-dasharray: 290;\n  stroke-dashoffset: 290;\n  animation: drawCircle 2.4s ease-in-out infinite alternate;\n}\n@keyframes drawCircle {\n  to { stroke-dashoffset: 0; transform: rotate(180deg); transform-origin: center; }\n}",
    "jsCode": "// Dynamic SVG Path Length Calculation\nconst path = document.querySelector('.ux-svg-morph path');\nconst len = path.getTotalLength();\npath.style.strokeDasharray = len;\npath.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1400, iterations: Infinity });",
    "stageType": "svg-morph"
  },
  {
    "id": "canvas-particles",
    "name": "HTML5 Canvas Particle Constellation",
    "category": "HTML5 Canvas 2D / WebGL",
    "fps": "RequestAnimationFrame Loop",
    "description": "Real-time interactive particle network rendered on an HTML5 <canvas> element with proximity connecting lines.",
    "animationClass": "anim-canvas",
    "htmlCode": "<canvas id=\"ux-particle-canvas\" width=\"420\" height=\"220\"></canvas>",
    "cssCode": "#ux-particle-canvas {\n  width: 100%;\n  height: 220px;\n  border-radius: 16px;\n  background: radial-gradient(circle at center, #1e1b4b, #020617);\n}",
    "jsCode": "const ctx = canvas.getContext('2d');\nfunction renderFrame() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  particles.forEach(p => {\n    p.x += p.vx; p.y += p.vy;\n    ctx.beginPath();\n    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);\n    ctx.fillStyle = '#818cf8';\n    ctx.fill();\n  });\n  requestAnimationFrame(renderFrame);\n}",
    "stageType": "canvas-particles"
  },
  {
    "id": "stagger-grid",
    "name": "Choreographed Staggered Bento Reveal",
    "category": "CSS Grid & Choreographed Motion",
    "fps": "GPU Composite Layer",
    "description": "Cascading entrance choreography using CSS custom properties (--stagger-idx) for dashboard cards and lists.",
    "animationClass": "anim-stagger",
    "htmlCode": "<div class=\"stagger-grid\">\n  <div class=\"cell\" style=\"--i:0\">Card 01</div>\n  <div class=\"cell\" style=\"--i:1\">Card 02</div>\n  <div class=\"cell\" style=\"--i:2\">Card 03</div>\n</div>",
    "cssCode": ".stagger-grid .cell {\n  opacity: 0;\n  animation: slideUpFade 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;\n  animation-delay: calc(var(--i) * 180ms);\n}\n@keyframes slideUpFade {\n  0% { opacity: 0.25; transform: translateY(18px) scale(0.94); }\n  100% { opacity: 1; transform: translateY(0) scale(1); }\n}",
    "jsCode": "// Staggered IntersectionObserver Trigger\ndocument.querySelectorAll('.stagger-grid .cell').forEach((el, i) => {\n  el.style.setProperty('--i', i);\n  el.classList.add('is-visible');\n});",
    "stageType": "stagger"
  },
  {
    "id": "liquid-blob",
    "name": "Organic Liquid Morphing Blob",
    "category": "CSS Border-Radius & Filter Morph",
    "fps": "60 FPS Fluid Shader",
    "stageType": "liquid-blob",
    "description": "Continuous organic border-radius morphing with backdrop blur and multi-stop aurora gradient rotation.",
    "htmlCode": "<div class=\"liquid-aurora-blob\">\n  <span>Fluid Morph</span>\n</div>",
    "cssCode": "@keyframes blobMorph {\n  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(1); }\n  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(180deg) scale(1.08); }\n}\n.liquid-aurora-blob {\n  width: 140px; height: 140px;\n  background: linear-gradient(135deg, #6366f1, #ec4899, #10b981);\n  animation: blobMorph 4s ease-in-out infinite;\n}",
    "jsCode": "const blob = document.querySelector('.liquid-aurora-blob');\nblob.addEventListener('pointermove', (e) => {\n  const rect = blob.getBoundingClientRect();\n  blob.style.setProperty('--mx', `${e.clientX - rect.left}px`);\n});"
  },
  {
    "id": "neon-glitch",
    "name": "Cyberpunk Chromatic Glitch Text",
    "category": "CSS Clip-Path & RGB Split",
    "fps": "High-Frequency Keyframes",
    "stageType": "neon-glitch",
    "description": "Dual pseudo-element chromatic aberration and clip-path slice displacement for hero headlines and alerts.",
    "htmlCode": "<div class=\"glitch-wrapper\">\n  <h2 class=\"glitch-text\" data-text=\"SYSTEM_ONLINE\">SYSTEM_ONLINE</h2>\n</div>",
    "cssCode": "@keyframes glitchSlice {\n  0% { clip-path: inset(20% 0 50% 0); transform: translate(-3px, 1px); }\n  50% { clip-path: inset(60% 0 10% 0); transform: translate(3px, -2px); }\n  100% { clip-path: inset(10% 0 70% 0); transform: translate(-2px, 2px); }\n}\n.glitch-text {\n  text-shadow: -2px 0 #ec4899, 2px 0 #06b6d4;\n  animation: glitchSlice 1.5s steps(4) infinite alternate;\n}",
    "jsCode": "const glitch = document.querySelector('.glitch-text');\nsetInterval(() => {\n  glitch.dataset.active = String(Math.random() > 0.3);\n}, 400);"
  },
  {
    "id": "flip-card-3d",
    "name": "3D Isometric Dual-Face Card Flip",
    "category": "CSS3 Backface-Visibility 3D",
    "fps": "Hardware Preserve-3D",
    "stageType": "flip-card",
    "description": "180-degree Y-axis perspective card rotation revealing secondary telemetry backplate without DOM reflow.",
    "htmlCode": "<div class=\"flip-scene\">\n  <div class=\"flip-card\">\n    <div class=\"face front\">Front Telemetry</div>\n    <div class=\"face back\">Back Inspector</div>\n  </div>\n</div>",
    "cssCode": "@keyframes autoFlip3D {\n  0%, 25% { transform: rotateY(0deg); }\n  50%, 75% { transform: rotateY(180deg); }\n  100% { transform: rotateY(360deg); }\n}\n.flip-card {\n  transform-style: preserve-3d;\n  animation: autoFlip3D 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;\n}",
    "jsCode": "const card = document.querySelector('.flip-card');\ncard.addEventListener('click', () => {\n  card.classList.toggle('is-flipped');\n});"
  },
  {
    "id": "audio-equalizer",
    "name": "HTML5 WebAudio Spectrum Equalizer",
    "category": "Audio Visualization & Bars",
    "fps": "60 FPS Frequency Bars",
    "stageType": "equalizer",
    "description": "Multi-band harmonic frequency bar visualizer with phase-offset keyframe scaling and peak glow indicators.",
    "htmlCode": "<div class=\"eq-bars\">\n  <span style=\"--d:0.1s\"></span><span style=\"--d:0.3s\"></span><span style=\"--d:0.2s\"></span>\n  <span style=\"--d:0.4s\"></span><span style=\"--d:0.15s\"></span><span style=\"--d:0.35s\"></span>\n</div>",
    "cssCode": "@keyframes eqPulse {\n  0% { transform: scaleY(0.2); }\n  50% { transform: scaleY(1); }\n  100% { transform: scaleY(0.35); }\n}\n.eq-bars span {\n  display: inline-block; width: 10px; height: 90px;\n  background: linear-gradient(to top, #4f46e5, #34d399);\n  animation: eqPulse 0.9s ease-in-out infinite alternate;\n  animation-delay: var(--d);\n}",
    "jsCode": "const analyser = audioCtx.createAnalyser();\nanalyser.fftSize = 32;\nconst data = new Uint8Array(analyser.frequencyBinCount);\nfunction updateBars() {\n  analyser.getByteFrequencyData(data);\n  requestAnimationFrame(updateBars);\n}"
  },
  {
    "id": "skeleton-shimmer",
    "name": "Shimmering Skeleton Content Loader",
    "category": "Perceived Performance UX",
    "fps": "GPU Linear-Gradient Sweep",
    "stageType": "shimmer",
    "description": "Directional specular highlight sweep across placeholder layout blocks during asynchronous data hydration.",
    "htmlCode": "<div class=\"skeleton-card\">\n  <div class=\"sk-avatar shimmer\"></div>\n  <div class=\"sk-line shimmer w-80\"></div>\n  <div class=\"sk-line shimmer w-60\"></div>\n</div>",
    "cssCode": "@keyframes shimmerSweep {\n  0% { background-position: -200% 0; }\n  100% { background-position: 200% 0; }\n}\n.shimmer {\n  background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);\n  background-size: 200% 100%;\n  animation: shimmerSweep 1.8s infinite linear;\n}",
    "jsCode": "function setHydrated(container, isLoaded) {\n  container.querySelectorAll('.shimmer').forEach(el => {\n    el.classList.toggle('shimmer', !isLoaded);\n  });\n}"
  },
  {
    "id": "typewriter-terminal",
    "name": "Typewriter Matrix Command Stream",
    "category": "Stepped Character Animation",
    "fps": "CSS steps() Timing Function",
    "stageType": "typewriter",
    "description": "Monospace terminal typing sequence with blinking block cursor and stepped width reveal.",
    "htmlCode": "<div class=\"typewriter-box\">\n  <span class=\"typed-line\">&gt; compiling html5_shaders.wasm... [OK]</span>\n</div>",
    "cssCode": "@keyframes typeReveal {\n  from { width: 0; }\n  to { width: 100%; }\n}\n.typed-line {\n  display: inline-block; overflow: hidden; white-space: nowrap;\n  border-right: 2px solid #34d399;\n  animation: typeReveal 2.6s steps(36, end) infinite alternate;\n}",
    "jsCode": "async function typeText(el, text, speed = 35) {\n  el.textContent = '';\n  for (const ch of text) {\n    el.textContent += ch;\n    await new Promise(r => setTimeout(r, speed));\n  }\n}"
  },
  {
    "id": "orbital-rings",
    "name": "3D Gyroscopic Orbital Rings",
    "category": "Multi-Axis CSS3 3D Rotation",
    "fps": "60 FPS Matrix3D",
    "stageType": "orbit",
    "description": "Intersecting X/Y/Z axis concentric rings rotating in 3D space around a luminous quantum core.",
    "htmlCode": "<div class=\"orbit-system\">\n  <div class=\"ring ring-x\"></div>\n  <div class=\"ring ring-y\"></div>\n  <div class=\"ring ring-z\"></div>\n  <div class=\"core-dot\"></div>\n</div>",
    "cssCode": "@keyframes spin3D {\n  0% { transform: rotateX(65deg) rotateY(15deg) rotateZ(0deg); }\n  100% { transform: rotateX(65deg) rotateY(15deg) rotateZ(360deg); }\n}\n.ring {\n  border: 2px solid #818cf8; border-radius: 50%;\n  animation: spin3D 2.4s linear infinite;\n}",
    "jsCode": "document.querySelectorAll('.ring').forEach((ring, idx) => {\n  ring.style.animationDuration = `${2.2 + idx * 0.6}s`;\n});"
  },
  {
    "id": "magnetic-dock",
    "name": "MacOS-Style Magnetic Magnification Dock",
    "category": "Proximity Spring Scaling",
    "fps": "Interactive Pointer Physics",
    "stageType": "dock",
    "description": "Gaussian proximity scaling dock where neighboring icons smoothly interpolate size based on cursor distance.",
    "htmlCode": "<div class=\"magnetic-dock\">\n  <button class=\"dock-item\">\u26a1</button>\n  <button class=\"dock-item\">\ud83c\udfa8</button>\n  <button class=\"dock-item\">\ud83d\ude80</button>\n  <button class=\"dock-item\">\ud83d\udc8e</button>\n</div>",
    "cssCode": "@keyframes dockWave {\n  0%, 100% { transform: translateY(0) scale(1); }\n  50% { transform: translateY(-12px) scale(1.28); }\n}\n.dock-item {\n  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);\n  animation: dockWave 1.6s ease-in-out infinite;\n}",
    "jsCode": "dock.addEventListener('mousemove', (e) => {\n  items.forEach(item => {\n    const d = Math.abs(e.clientX - (item.offsetLeft + item.offsetWidth / 2));\n    const scale = Math.max(1, 1.5 - d / 120);\n    item.style.transform = `scale(${scale}) translateY(${-(scale-1)*20}px)`;\n  });\n});"
  },
  {
    "id": "radar-sonar",
    "name": "Concentric Telemetry Radar Sweep",
    "category": "Conic-Gradient & Ripple UX",
    "fps": "Continuous Conic Scan",
    "stageType": "radar",
    "description": "Rotating conic-gradient radar scanner with pulsing target blips for real-time network and geospatial UIs.",
    "htmlCode": "<div class=\"radar-circle\">\n  <div class=\"radar-beam\"></div>\n  <span class=\"radar-blip\"></span>\n</div>",
    "cssCode": "@keyframes radarSpin {\n  from { transform: rotate(0deg); }\n  to { transform: rotate(360deg); }\n}\n.radar-beam {\n  background: conic-gradient(from 0deg, transparent 70%, rgba(52, 211, 153, 0.55));\n  animation: radarSpin 2.2s linear infinite;\n}",
    "jsCode": "function spawnBlip(radar, x, y) {\n  const blip = document.createElement('span');\n  blip.className = 'radar-blip';\n  blip.style.left = `${x}%`; blip.style.top = `${y}%`;\n  radar.appendChild(blip);\n}"
  },
  {
    "id": "parallax-layers",
    "name": "Multi-Depth Parallax Glass Stack",
    "category": "Z-Depth Layer Choreography",
    "fps": "GPU Translate3D Stack",
    "stageType": "parallax",
    "description": "Three-tier floating glassmorphic layers moving at differential velocities to create deep spatial hierarchy.",
    "htmlCode": "<div class=\"parallax-stack\">\n  <div class=\"layer bg-layer\">Layer 01</div>\n  <div class=\"layer mid-layer\">Layer 02</div>\n  <div class=\"layer fg-layer\">Layer 03</div>\n</div>",
    "cssCode": "@keyframes layerFloat {\n  0% { transform: translateY(8px) scale(0.95); }\n  100% { transform: translateY(-8px) scale(1.03); }\n}\n.parallax-stack .layer {\n  backdrop-filter: blur(12px);\n  animation: layerFloat 2s ease-in-out infinite alternate;\n}",
    "jsCode": "window.addEventListener('pointermove', (e) => {\n  const x = (e.clientX / window.innerWidth - 0.5) * 24;\n  const y = (e.clientY / window.innerHeight - 0.5) * 24;\n  layers.forEach((l, i) => l.style.transform = `translate3d(${x*(i+1)*0.4}px, ${y*(i+1)*0.4}px, 0)`);\n});"
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
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2">Responsive portal for ui/ ux annimations for html5 and also when sel</h1>
            <p className="text-xs text-slate-400 mt-1">Create a responsive portal for UI/ UX annimations for HTML5 and also when selected the respective type it also provide a sample code for the same</p>
            <p className="text-xs text-emerald-400 mt-1">Latest Update: Add more annimation type, atleast 10, currently onl5 are there</p>
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
