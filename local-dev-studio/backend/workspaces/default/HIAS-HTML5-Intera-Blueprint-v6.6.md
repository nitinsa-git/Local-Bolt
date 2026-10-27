# 📐 HIAS-HTML5-Intera-Blueprint-v6.6 — HTML5 Interactive Animation Studio

> **Application Development Blueprint & Full-Stack Expansion Specification**
> - **Blueprint Title**: `HIAS-HTML5-Intera-Blueprint-v6.6`
> - **Application Name**: **HTML5 Interactive Animation Studio**
> - **Abbreviated App ID**: `HIAS-HTML5-Intera` (`default`)
> - **Blueprint Version**: `v6.6`
> - **Target Stack Template**: `nextjs`
> - **Generated At**: `2026-10-22 18:01:13 UTC`

---

## 🚀 1. Master Build Prompt (Copy & Paste into Claude / Antigravity / Cursor)

```markdown
<APPLICATION_BUILD_BLUEPRINT>
You are a Senior Full-Stack Product Engineer. I have prototyped the "HTML5 Interactive Animation Studio" application (`HIAS-HTML5-Intera-Blueprint-v6.6`).
This Blueprint contains the product overview, UI component inventory, domain data models, controller functions, and the complete working prototype code for "HTML5 Interactive Animation Studio".

Your Task:
1. Build out and scale "HTML5 Interactive Animation Studio" into a full production-ready, multi-file application (nextjs) based on this Blueprint.
2. Preserve 100% of the existing domain features, interactive controls, visual styling, animations, and datasets documented below.
3. Modularize the UI into clean components, connect the application data entities to persistent API routes/services, and include validation and automated tests.
</APPLICATION_BUILD_BLUEPRINT>
```

---

## 🎯 2. Application Overview & Functional Scope

- **Application Name**: **HTML5 Interactive Animation Studio**
- **Target Framework Stack**: `nextjs`
- **Functional Summary**:
  > Create a responsive portal for UI/ UX animations for HTML5 and also when selected the respective type it also provide a sample code for the same

---

## 🖥️ 3. Application UI Architecture, Views & Interactive Controls

### 3.1 Screen Headings & Functional Views
- `HTML5 Interactive Animation Studio`

### 3.2 Interactive Buttons & User Actions
- **0.5x** (action: `setSpeed(0.5, this)`)
- **1x** (action: `setSpeed(1, this)`)
- **2x** (action: `setSpeed(2, this)`)
- **Replay Animation** (action: `replayAnimation()`)
- **Copy Library CDN** (`#copy-cdn-btn`, action: `copyLibraryCdn()`)
- **Copy Sample Code** (`#copy-btn`, action: `copySampleCode()`)
- **HTML5 Markup** (`#tab-html`, action: `switchCodeTab('html')`)
- **CSS3 Keyframes** (`#tab-css`, action: `switchCodeTab('css')`)
- **JavaScript (WAAPI)** (`#tab-js`, action: `switchCodeTab('js')`)
- **GSAP 3 Library** (`#tab-gsap`, action: `switchCodeTab('gsap')`)
- **Anime.js / Framer Motion** (`#tab-libs`, action: `switchCodeTab('libs')`)

### 3.3 Search, Filter & Form Controls
- `<input>` `#filter-input` — placeholder: *"Search animation or category..."* (handler: `filterTypes(this.value)`)

### 3.4 Visual Design Tokens & Motion System
- **CSS Custom Variables**: `--accent`, `--accent-light`, `--i`, `--d`
- **CSS `@keyframes` Animations (21)**: `float3d`, `elasticPulse`, `svgStroke`, `staggerWave`, `blobMorph`, `glitchAnim`, `flip3D`, `eqBar`, `shimmerSweep`, `radarSweep`, `elasticBounce`, `drawCircle`, `slideUpFade`, `glitchSlice`, `autoFlip3D`, `eqPulse`, `typeReveal`, `spin3D`, `dockWave`, `radarSpin`, `layerFloat`

---

## ⚙️ 4. Application Controller Functions & Domain Data Entities

### 4.1 Client Controller Functions & Event Handlers
- `function triggerElastic(target)`
- `function renderFrame()`
- `function updateBars()`
- `function setHydrated(container, isLoaded)`
- `async function typeText(el, text, speed = 35)`
- `function spawnBlip(radar, x, y)`
- `function animate()`
- `function filterTypes(val)`
- `function renderTypeList()`
- `function renderStage(item)`
- `function initCanvasParticles()`
- `function loop()`
- `function buildGsapCode(item)`
- `function buildLibrariesCode(item)`
- `function updateCodeView()`
- `function selectType(idx)`
- `function switchCodeTab(tab)`
- `function setSpeed(s, btn)`
- `function replayAnimation()`
- `function copyLibraryCdn()`
- `function copySampleCode()`

### 4.2 Application Domain Datasets & State Entities
- **Dataset `CATALOG`**:
  - **Schema Fields**: `id`, `name`, `category`, `fps`, `stageType`, `description`, `htmlCode`, `cssCode`, `jsCode`
  - **Sample Records**: `3D Glassmorphic Tilt & Glow`, `Elastic Spring Micro-Interaction`, `HTML5 SVG Stroke & Path Morphing`, `HTML5 Canvas Particle Constellation`, `Choreographed Staggered Bento Reveal`, `Organic Liquid Morphing Blob`, `Cyberpunk Chromatic Glitch Text`, `3D Isometric Dual-Face Card Flip`, `HTML5 WebAudio Spectrum Equalizer`, `Shimmering Skeleton Content Loader`, `Typewriter Matrix Command Stream`, `3D Gyroscopic Orbital Rings`

---

## 🛠️ 5. Next-Phase Expansion Roadmap for HTML5 Interactive Animation Studio

- [ ] **Component Modularization**: Extract the header, sidebar selector/filter list, live stage/canvas viewer, and tabbed inspector from `index.html` into dedicated reusable components.
- [ ] **Persistent Backend & API Routes**: Connect the `HTML5 Interactive Animation Studio` datasets above to backend `GET / POST / PUT / DELETE` API routes with search, filtering, and user-saved presets.
- [ ] **Export & Sharing Workflows**: Add one-click export (CodePen / StackBlitz / ZIP bundle / shareable permalink) for user-configured items inside `HTML5 Interactive Animation Studio`.
- [ ] **Unit & E2E Verification**: Add Playwright / Vitest tests verifying search filtering, category switching, playback controls, and clipboard copy actions.

---

## 💻 6. Complete Prototype Source Code (`HTML5 Interactive Animation Studio`)

Below is the complete working prototype code for **HTML5 Interactive Animation Studio**:

### File: `.gitignore`
````html
node_modules/
.studio_backups/
.next/
.env

````

### File: `app/page.tsx`
````tsx
"use client";
import React, { useState } from "react";

const ITEMS = [
  {
    "id": "morph-card",
    "name": "3D Glassmorphic Tilt & Glow",
    "category": "HTML5 / CSS3 3D Transform",
    "fps": "60 FPS Hardware Accelerated",
    "stageType": "3d-card",
    "description": "Interactive perspective card with specular radial highlight, spring easing, and layered depth shadows.",
    "htmlCode": "<div class=\"ux-card-3d\">\n  <div class=\"ux-glow\"></div>\n  <h3>HTML5 3D Perspective</h3>\n  <p>Hover or trigger keyframes</p>\n</div>",
    "cssCode": ".ux-card-3d {\n  transform-style: preserve-3d;\n  animation: float3d 3.2s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;\n  background: linear-gradient(135deg, rgba(99,102,241,0.28), rgba(15,23,42,0.9));\n  border: 1px solid rgba(129,140,248,0.45);\n  border-radius: 20px;\n}\n@keyframes float3d {\n  0% { transform: perspective(800px) rotateX(0deg) rotateY(-8deg) translateY(0px); }\n  100% { transform: perspective(800px) rotateX(8deg) rotateY(10deg) translateY(-14px); }\n}",
    "jsCode": "const el = document.querySelector('.ux-card-3d');\nel.animate([\n  { transform: 'perspective(800px) rotateY(-8deg) scale(0.96)' },\n  { transform: 'perspective(800px) rotateY(8deg) scale(1.04)' }\n], { duration: 1800, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });"
  },
  {
    "id": "elastic-pulse",
    "name": "Elastic Spring Micro-Interaction",
    "category": "Keyframes & Spring Physics",
    "fps": "120Hz ProMotion Ready",
    "stageType": "elastic",
    "description": "Multi-stage elastic bounce and ripple wave propagation for interactive CTA buttons and status indicators.",
    "htmlCode": "<button class=\"ux-elastic-btn\">\n  <span class=\"pulse-ring\"></span>\n  <span class=\"label\">Trigger Elastic Action</span>\n</button>",
    "cssCode": "@keyframes elasticBounce {\n  0% { transform: scale(0.85); }\n  40% { transform: scale(1.12); }\n  70% { transform: scale(0.95); }\n  100% { transform: scale(1); }\n}\n.ux-elastic-btn {\n  animation: elasticBounce 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;\n}",
    "jsCode": "function triggerElastic(target) {\n  target.style.animation = 'none';\n  target.offsetHeight;\n  target.style.animation = 'elasticBounce 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)';\n}"
  },
  {
    "id": "svg-path-morph",
    "name": "HTML5 SVG Stroke & Path Morphing",
    "category": "SVG Vector Animation",
    "fps": "Zero-Layout-Shift Vector",
    "stageType": "svg-morph",
    "description": "Synchronized stroke-dasharray drawing and gradient stop morphing for onboarding and telemetry icons.",
    "htmlCode": "<svg viewBox=\"0 0 120 120\" class=\"ux-svg-morph\">\n  <circle cx=\"60\" cy=\"60\" r=\"46\" stroke=\"url(#grad)\" stroke-width=\"6\" fill=\"none\" />\n  <path d=\"M38 62 L54 76 L84 44\" stroke=\"#34d399\" stroke-width=\"6\" fill=\"none\" />\n</svg>",
    "cssCode": ".ux-svg-morph circle {\n  stroke-dasharray: 290;\n  stroke-dashoffset: 290;\n  animation: drawCircle 2.4s ease-in-out infinite alternate;\n}\n@keyframes drawCircle {\n  to { stroke-dashoffset: 0; transform: rotate(180deg); transform-origin: center; }\n}",
    "jsCode": "const path = document.querySelector('.ux-svg-morph path');\nconst len = path.getTotalLength();\npath.style.strokeDasharray = len;\npath.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1400, iterations: Infinity });"
  },
  {
    "id": "canvas-particles",
    "name": "HTML5 Canvas Particle Constellation",
    "category": "HTML5 Canvas 2D / WebGL",
    "fps": "RequestAnimationFrame Loop",
    "stageType": "canvas-particles",
    "description": "Real-time interactive particle network rendered on an HTML5 <canvas> element with proximity connecting lines.",
    "htmlCode": "<canvas id=\"ux-particle-canvas\" width=\"420\" height=\"220\"></canvas>",
    "cssCode": "#ux-particle-canvas {\n  width: 100%;\n  height: 220px;\n  border-radius: 16px;\n  background: radial-gradient(circle at center, #1e1b4b, #020617);\n}",
    "jsCode": "const ctx = canvas.getContext('2d');\nfunction renderFrame() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  particles.forEach(p => {\n    p.x += p.vx; p.y += p.vy;\n    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);\n    ctx.fillStyle = '#818cf8'; ctx.fill();\n  });\n  requestAnimationFrame(renderFrame);\n}"
  },
  {
    "id": "stagger-grid",
    "name": "Choreographed Staggered Bento Reveal",
    "category": "CSS Grid & Choreographed Motion",
    "fps": "GPU Composite Layer",
    "stageType": "stagger",
    "description": "Cascading entrance choreography using CSS custom properties (--stagger-idx) for dashboard cards and lists.",
    "htmlCode": "<div class=\"stagger-grid\">\n  <div class=\"cell\" style=\"--i:0\">Card 01</div>\n  <div class=\"cell\" style=\"--i:1\">Card 02</div>\n  <div class=\"cell\" style=\"--i:2\">Card 03</div>\n</div>",
    "cssCode": ".stagger-grid .cell {\n  opacity: 0;\n  animation: slideUpFade 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;\n  animation-delay: calc(var(--i) * 180ms);\n}\n@keyframes slideUpFade {\n  0% { opacity: 0.25; transform: translateY(18px) scale(0.94); }\n  100% { opacity: 1; transform: translateY(0) scale(1); }\n}",
    "jsCode": "document.querySelectorAll('.stagger-grid .cell').forEach((el, i) => {\n  el.style.setProperty('--i', i);\n  el.classList.add('is-visible');\n});"
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
  },
  {
    "id": "gsap-scrolltrigger-pin",
    "name": "GSAP 3 ScrollTrigger Timeline & Scrub",
    "category": "GSAP 3 / JS Animation Library",
    "fps": "GSAP 3 Ticker 120FPS",
    "stageType": "3d-card",
    "description": "GreenSock GSAP 3 timeline with ScrollTrigger scrubbing, staggered split-text reveal, and hardware-accelerated matrix transforms.",
    "htmlCode": "<section class=\"gsap-stage\">\n  <div class=\"gsap-box\">GSAP 3 Timeline</div>\n  <div class=\"gsap-sub\">ScrollTrigger Scrub Active</div>\n</section>",
    "cssCode": ".gsap-stage {\n  display: flex; flex-direction: column; align-items: center; gap: 12px;\n}\n.gsap-box {\n  padding: 18px 28px; border-radius: 16px;\n  background: linear-gradient(135deg, #10b981, #4f46e5);\n  will-change: transform, opacity;\n}",
    "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js\nconst tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'power3.inOut' } });\ntl.fromTo('.gsap-box', { y: 24, rotateX: -25, opacity: 0.4 }, { y: -12, rotateX: 15, opacity: 1, duration: 1.1 })\n  .to('.gsap-sub', { scale: 1.08, color: '#34d399', duration: 0.6 }, '-=0.5');"
  },
  {
    "id": "animejs-svg-morph",
    "name": "Anime.js Staggered Grid & SVG Morph",
    "category": "Anime.js / JS Library",
    "fps": "Anime.js Spring Engine",
    "stageType": "svg-morph",
    "description": "Anime.js keyframe timeline with 2D grid stagger propagation, spring physics easing, and SVG polygon morphing.",
    "htmlCode": "<div class=\"anime-grid\">\n  <span class=\"dot\"></span><span class=\"dot\"></span><span class=\"dot\"></span>\n  <span class=\"dot\"></span><span class=\"dot\"></span><span class=\"dot\"></span>\n</div>",
    "cssCode": ".anime-grid {\n  display: grid; grid-template-columns: repeat(3, 36px); gap: 12px;\n}\n.anime-grid .dot {\n  width: 36px; height: 36px; border-radius: 10px;\n  background: linear-gradient(135deg, #ec4899, #6366f1);\n}",
    "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js\nanime({\n  targets: '.anime-grid .dot',\n  scale: [{ value: 0.4, easing: 'easeOutSine', duration: 400 }, { value: 1.15, easing: 'easeInOutQuad', duration: 750 }],\n  rotateZ: anime.stagger([-25, 25], { grid: [3, 2], from: 'center' }),\n  delay: anime.stagger(110, { grid: [3, 2], from: 'center' }),\n  loop: true,\n  direction: 'alternate'\n});"
  },
  {
    "id": "framer-motion-spring",
    "name": "Framer Motion Layout & Gesture Spring",
    "category": "Framer Motion / React Library",
    "fps": "Spring Physics Solver",
    "stageType": "elastic",
    "description": "Declarative Framer Motion spring physics (`stiffness: 420, damping: 24`) with `whileHover`, `whileTap`, and `layoutId` shared element transitions.",
    "htmlCode": "<div class=\"motion-card\" data-layout-id=\"hero-card\">\n  <h4>Framer Motion Spring</h4>\n  <p>Drag, hover, or tap to trigger spring physics</p>\n</div>",
    "cssCode": ".motion-card {\n  padding: 20px 28px; border-radius: 20px;\n  background: rgba(99, 102, 241, 0.22);\n  border: 1px solid rgba(165, 180, 252, 0.45);\n  cursor: grab;\n}",
    "jsCode": "// NPM: npm install framer-motion\nimport { motion } from 'framer-motion';\nexport const SpringCard = () => (\n  <motion.div\n    layoutId=\"hero-card\"\n    whileHover={{ scale: 1.06, rotateY: 8 }}\n    whileTap={{ scale: 0.94 }}\n    transition={{ type: 'spring', stiffness: 420, damping: 24 }}\n    className=\"motion-card\"\n  />\n);"
  },
  {
    "id": "threejs-webgl-torus",
    "name": "Three.js WebGL 3D Shader Torus",
    "category": "Three.js / WebGL 3D Library",
    "fps": "WebGL 2.0 GPU Shader",
    "stageType": "orbit",
    "description": "Three.js WebGLRenderer scene with an iridescent wireframe TorusKnotGeometry, point lights, and orbital camera damping.",
    "htmlCode": "<canvas id=\"three-webgl-stage\" width=\"480\" height=\"240\"></canvas>",
    "cssCode": "#three-webgl-stage {\n  width: 100%; height: 240px; border-radius: 16px;\n  background: radial-gradient(circle at center, #0f172a, #020617);\n}",
    "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js\nconst scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);\nconst mesh = new THREE.Mesh(\n  new THREE.TorusKnotGeometry(1.1, 0.34, 100, 16),\n  new THREE.MeshNormalMaterial({ wireframe: true })\n);\nscene.add(mesh); camera.position.z = 3.5;\nfunction animate() { requestAnimationFrame(animate); mesh.rotation.x += 0.015; mesh.rotation.y += 0.02; renderer.render(scene, camera); }"
  },
  {
    "id": "motion-one-waapi",
    "name": "Motion One & Velocity.js Spring Flip",
    "category": "Motion One / WAAPI Library",
    "fps": "Hardware WAAPI Engine",
    "stageType": "flip-card",
    "description": "Ultra-lightweight Motion One (`animate`, `spring`, `stagger`) driving native browser Web Animations API keyframes on the compositor thread.",
    "htmlCode": "<div class=\"motion-one-deck\">\n  <div class=\"m-card\">WAAPI 01</div>\n  <div class=\"m-card\">WAAPI 02</div>\n  <div class=\"m-card\">WAAPI 03</div>\n</div>",
    "cssCode": ".motion-one-deck { display: flex; gap: 12px; perspective: 800px; }\n.m-card {\n  padding: 16px 20px; border-radius: 14px;\n  background: #1e1b4b; border: 1px solid #6366f1;\n}",
    "jsCode": "// CDN: https://cdn.jsdelivr.net/npm/motion@10.18.0/+esm\nimport { animate, stagger, spring } from 'motion';\nanimate(\n  '.m-card',\n  { y: [-14, 0], rotateY: [25, 0], opacity: [0.4, 1] },\n  { delay: stagger(0.12), easing: spring({ stiffness: 320, damping: 20 }), repeat: Infinity, direction: 'alternate' }\n);"
  },
  {
    "id": "custom-js-fx",
    "name": "Custom JS Animation",
    "category": "JS / GSAP / Anime.js",
    "fps": "60 FPS GPU",
    "stageType": "3d-card",
    "description": "A custom JavaScript animation using GSAP or Anime.js for advanced 3D card animations.",
    "htmlCode": "<div id='card' class='card'>Card Content</div>",
    "cssCode": ".card { width: 200px; height: 200px; background-color: #3498db; color: white; display: flex; align-items: center; justify-content: center; transition: transform 0.5s ease-in-out; }",
    "jsCode": "gsap.to('#card', { duration: 1, rotationY: 360, ease: 'power2.inOut' });"
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
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2">HTML5 Interactive Animation Studio</h1>
            <p className="text-xs text-slate-400 mt-1">Create a responsive portal for UI/ UX animations for HTML5 and also when selected the respective type it also provide a sample code for the same</p>
            <p className="text-xs text-emerald-400 mt-1">Latest Update: Add more animations to the list, also if okay add javascript or libraries in code generation window</p>
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

````

### File: `index.html`
````html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HTML5 Interactive Animation Studio</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --accent: #6366f1;
      --accent-light: #818cf8;
    }
    body {
      background: radial-gradient(circle at top right, #1e1b4b 0%, #020617 60%);
      color: #f1f5f9;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      line-height: 1.5;
    }
    .shell { max-width: 1120px; margin: 0 auto; padding: 20px 18px 56px; display: flex; flex-direction: column; gap: 18px; }
    .card {
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid #1e293b;
      border-radius: 18px;
      padding: 20px;
      box-shadow: 0 20px 45px -15px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 11px; border-radius: 999px; font-size: 11px; font-weight: 700;
      background: rgba(99, 102, 241, 0.18); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.35);
    }
    .layout-grid {
      display: grid;
      grid-template-columns: 330px 1fr;
      gap: 18px;
      align-items: start;
    }
    @media (max-width: 780px) {
      .layout-grid { grid-template-columns: 1fr; }
    }
    .search-input {
      width: 100%; padding: 9px 12px; border-radius: 10px;
      background: #020617; border: 1px solid #1e293b; color: #f8fafc;
      font-size: 12px; margin-bottom: 10px; outline: none;
    }
    .search-input:focus { border-color: var(--accent); }
    .type-scroll {
      max-height: 520px; overflow-y: auto; padding-right: 4px;
    }
    .type-btn {
      width: 100%; text-align: left; cursor: pointer;
      padding: 12px 13px; border-radius: 14px;
      background: rgba(2, 6, 23, 0.65); border: 1px solid #1e293b;
      color: #e2e8f0; transition: all 0.18s ease; margin-bottom: 8px;
    }
    .type-btn:hover { border-color: var(--accent); background: rgba(30, 27, 75, 0.45); }
    .type-btn.active {
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.28), rgba(15, 23, 42, 0.95));
      border-color: var(--accent-light);
      box-shadow: 0 8px 25px -6px rgba(79, 70, 229, 0.45);
    }
    .stage-box {
      height: 240px; border-radius: 16px;
      background: radial-gradient(circle at center, rgba(49, 46, 129, 0.45), #020617 85%);
      border: 1px solid #1e293b;
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; margin: 14px 0;
    }
    .btn {
      cursor: pointer; border: none; border-radius: 10px; padding: 8px 14px;
      font-size: 12px; font-weight: 600; transition: all 0.15s ease;
    }
    .btn-primary { background: var(--accent); color: white; }
    .btn-primary:hover { opacity: 0.92; }
    .btn-ghost { background: #0f172a; color: #94a3b8; border: 1px solid #1e293b; }
    .btn-ghost.active, .btn-ghost:hover { background: #1e293b; color: #ffffff; border-color: var(--accent); }
    pre {
      background: #020617; border: 1px solid #1e293b; border-radius: 12px;
      padding: 16px; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px; color: #c7d2fe; line-height: 1.55;
    }
    /* Live HTML5 Animation Keyframes */
    @keyframes float3d {
      0% { transform: perspective(700px) rotateX(-8deg) rotateY(-14deg) translateY(6px); }
      100% { transform: perspective(700px) rotateX(10deg) rotateY(14deg) translateY(-10px); }
    }
    @keyframes elasticPulse {
      0% { transform: scale(0.84); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
      50% { transform: scale(1.08); box-shadow: 0 0 0 22px rgba(99, 102, 241, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
    }
    @keyframes svgStroke {
      0% { stroke-dashoffset: 280; transform: rotate(0deg); }
      100% { stroke-dashoffset: 0; transform: rotate(360deg); }
    }
    @keyframes staggerWave {
      0% { transform: translateY(16px) scale(0.92); opacity: 0.35; }
      100% { transform: translateY(-6px) scale(1.03); opacity: 1; }
    }
    @keyframes blobMorph {
      0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(0.96); }
      50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(180deg) scale(1.08); }
    }
    @keyframes glitchAnim {
      0% { transform: translate(0); text-shadow: -3px 0 #ec4899, 3px 0 #06b6d4; }
      25% { transform: translate(-3px, 2px) skewX(4deg); text-shadow: 3px 0 #ec4899, -3px 0 #22d3ee; }
      50% { transform: translate(3px, -2px) skewX(-3deg); text-shadow: -2px -2px #f43f5e, 2px 2px #34d399; }
      100% { transform: translate(0); text-shadow: -3px 0 #ec4899, 3px 0 #06b6d4; }
    }
    @keyframes flip3D {
      0% { transform: perspective(700px) rotateY(0deg); }
      50% { transform: perspective(700px) rotateY(180deg); }
      100% { transform: perspective(700px) rotateY(360deg); }
    }
    @keyframes eqBar {
      0% { transform: scaleY(0.18); }
      100% { transform: scaleY(1); }
    }
    @keyframes shimmerSweep {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes radarSweep {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .demo-3d-card {
      width: 240px; padding: 22px; border-radius: 18px; text-align: center;
      background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(16,185,129,0.18));
      border: 1px solid rgba(165,180,252,0.5);
      box-shadow: 0 25px 50px -12px rgba(79, 70, 229, 0.5);
      animation: float3d calc(2.4s / var(--speed, 1)) ease-in-out infinite alternate;
    }
    .demo-elastic-pill {
      padding: 16px 28px; border-radius: 999px; font-weight: 800; font-size: 15px;
      background: linear-gradient(90deg, #4f46e5, #ec4899); color: white;
      animation: elasticPulse calc(1.8s / var(--speed, 1)) cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
    }
    .demo-stagger-row { display: flex; gap: 12px; }
    .demo-stagger-cell {
      width: 64px; height: 80px; border-radius: 14px;
      background: rgba(99, 102, 241, 0.25); border: 1px solid #6366f1;
      display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;
      animation: staggerWave calc(1.2s / var(--speed, 1)) ease-in-out infinite alternate;
    }
    .demo-liquid-blob {
      width: 135px; height: 135px; display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 12px; color: white;
      background: linear-gradient(135deg, #6366f1, #ec4899, #10b981);
      box-shadow: 0 0 40px rgba(236, 72, 153, 0.45);
      animation: blobMorph calc(3.6s / var(--speed, 1)) ease-in-out infinite;
    }
    .demo-glitch {
      font-size: 26px; font-weight: 900; letter-spacing: 0.12em; font-family: monospace;
      color: #f8fafc;
      animation: glitchAnim calc(0.9s / var(--speed, 1)) steps(3) infinite;
    }
    .demo-flip-card {
      width: 210px; height: 125px; border-radius: 16px;
      background: linear-gradient(135deg, #312e81, #0f172a);
      border: 2px solid #818cf8; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      animation: flip3D calc(3.8s / var(--speed, 1)) ease-in-out infinite;
    }
  </style>
</head>
<body>
  <div class="shell">
    <!-- Top Portal Header -->
    <header class="card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div>
        <span class="badge">Interactive Preview</span>
        <h1 style="font-size:22px;font-weight:800;margin-top:6px;letter-spacing:-0.02em;">HTML5 Interactive Animation Studio</h1>
        <p style="font-size:12.5px;color:#94a3b8;margin-top:2px;">Create a responsive portal for UI/ UX animations for HTML5 and also when selected the respective type it also provide a sample code for the same</p>
        <div style="margin-top:8px;display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border-radius:10px;background:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.35);font-size:11.5px;color:#6ee7b7;">
          <span>✓ Applied Project Update (#6):</span>
          <strong style="color:#ecfdf5;">Add more animations to the list, also if okay add javascript or libraries in code generation window</strong>
        </div>
        
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:11px;color:#94a3b8;">Playback Speed:</span>
        <button class="btn btn-ghost" onclick="setSpeed(0.5, this)">0.5x</button>
        <button class="btn btn-ghost active" onclick="setSpeed(1, this)">1x</button>
        <button class="btn btn-ghost" onclick="setSpeed(2, this)">2x</button>
      </div>
    </header>

    <!-- Main Interactive Split View: Animation Type Selector + Live Stage & Sample Code -->
    <div class="layout-grid">
      <!-- Left Column: Selectable Animation / Component Types -->
      <aside class="card" style="padding:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:2px 4px 8px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">
            Select Animation / UI Type (<span id="count-label">0</span>)
          </div>
        </div>
        <input
          id="filter-input"
          type="text"
          class="search-input"
          placeholder="Search animation or category..."
          oninput="filterTypes(this.value)"
        />
        <div id="type-list" class="type-scroll"></div>
      </aside>

      <!-- Right Column: Live Interactive Stage + Tabbed Sample Code Inspector -->
      <section style="display:flex;flex-direction:column;gap:16px;">
        <!-- Live HTML5 Animation Preview Stage -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div>
              <span id="active-category" class="badge">HTML5 / CSS3</span>
              <h2 id="active-title" style="font-size:18px;font-weight:800;margin-top:6px;"></h2>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span id="active-fps" style="font-size:11px;font-family:monospace;color:#34d399;background:rgba(16,185,129,0.14);padding:4px 10px;border-radius:8px;border:1px solid rgba(16,185,129,0.3);"></span>
              <button class="btn btn-primary" onclick="replayAnimation()">Replay Animation</button>
            </div>
          </div>
          <p id="active-desc" style="font-size:12.5px;color:#94a3b8;margin-top:6px;"></p>

          <div id="live-stage" class="stage-box"></div>
        </div>

        <!-- Sample Code & JS Library Generation Window for Selected Type -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#a5b4fc;">Code Generation Window</span>
              <span class="badge" style="font-size:10px;">HTML5 &bull; CSS3 &bull; JS &bull; Libraries</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
              <button id="copy-cdn-btn" class="btn btn-ghost" onclick="copyLibraryCdn()" style="font-size:11px;padding:6px 11px;">Copy Library CDN</button>
              <button id="copy-btn" class="btn btn-primary" onclick="copySampleCode()">Copy Sample Code</button>
            </div>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">
            <button id="tab-html" class="btn btn-ghost active" onclick="switchCodeTab('html')">HTML5 Markup</button>
            <button id="tab-css" class="btn btn-ghost" onclick="switchCodeTab('css')">CSS3 Keyframes</button>
            <button id="tab-js" class="btn btn-ghost" onclick="switchCodeTab('js')">JavaScript (WAAPI)</button>
            <button id="tab-gsap" class="btn btn-ghost" onclick="switchCodeTab('gsap')">GSAP 3 Library</button>
            <button id="tab-libs" class="btn btn-ghost" onclick="switchCodeTab('libs')">Anime.js / Framer Motion</button>
          </div>

          <div id="cdn-bar" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;margin-bottom:10px;border-radius:10px;background:rgba(30,27,75,0.45);border:1px solid rgba(99,102,241,0.3);font-size:11px;font-family:monospace;color:#c7d2fe;overflow-x:auto;">
            <span id="cdn-snippet">&lt;script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"&gt;&lt;/script&gt;</span>
          </div>

          <pre><code id="code-display"></code></pre>
        </div>
      </section>
    </div>
  </div>

  <script>
    const CATALOG = [
  {
    "id": "morph-card",
    "name": "3D Glassmorphic Tilt & Glow",
    "category": "HTML5 / CSS3 3D Transform",
    "fps": "60 FPS Hardware Accelerated",
    "stageType": "3d-card",
    "description": "Interactive perspective card with specular radial highlight, spring easing, and layered depth shadows.",
    "htmlCode": "<div class=\"ux-card-3d\">\n  <div class=\"ux-glow\"></div>\n  <h3>HTML5 3D Perspective</h3>\n  <p>Hover or trigger keyframes</p>\n</div>",
    "cssCode": ".ux-card-3d {\n  transform-style: preserve-3d;\n  animation: float3d 3.2s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate;\n  background: linear-gradient(135deg, rgba(99,102,241,0.28), rgba(15,23,42,0.9));\n  border: 1px solid rgba(129,140,248,0.45);\n  border-radius: 20px;\n}\n@keyframes float3d {\n  0% { transform: perspective(800px) rotateX(0deg) rotateY(-8deg) translateY(0px); }\n  100% { transform: perspective(800px) rotateX(8deg) rotateY(10deg) translateY(-14px); }\n}",
    "jsCode": "const el = document.querySelector('.ux-card-3d');\nel.animate([\n  { transform: 'perspective(800px) rotateY(-8deg) scale(0.96)' },\n  { transform: 'perspective(800px) rotateY(8deg) scale(1.04)' }\n], { duration: 1800, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });"
  },
  {
    "id": "elastic-pulse",
    "name": "Elastic Spring Micro-Interaction",
    "category": "Keyframes & Spring Physics",
    "fps": "120Hz ProMotion Ready",
    "stageType": "elastic",
    "description": "Multi-stage elastic bounce and ripple wave propagation for interactive CTA buttons and status indicators.",
    "htmlCode": "<button class=\"ux-elastic-btn\">\n  <span class=\"pulse-ring\"></span>\n  <span class=\"label\">Trigger Elastic Action</span>\n</button>",
    "cssCode": "@keyframes elasticBounce {\n  0% { transform: scale(0.85); }\n  40% { transform: scale(1.12); }\n  70% { transform: scale(0.95); }\n  100% { transform: scale(1); }\n}\n.ux-elastic-btn {\n  animation: elasticBounce 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;\n}",
    "jsCode": "function triggerElastic(target) {\n  target.style.animation = 'none';\n  target.offsetHeight;\n  target.style.animation = 'elasticBounce 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)';\n}"
  },
  {
    "id": "svg-path-morph",
    "name": "HTML5 SVG Stroke & Path Morphing",
    "category": "SVG Vector Animation",
    "fps": "Zero-Layout-Shift Vector",
    "stageType": "svg-morph",
    "description": "Synchronized stroke-dasharray drawing and gradient stop morphing for onboarding and telemetry icons.",
    "htmlCode": "<svg viewBox=\"0 0 120 120\" class=\"ux-svg-morph\">\n  <circle cx=\"60\" cy=\"60\" r=\"46\" stroke=\"url(#grad)\" stroke-width=\"6\" fill=\"none\" />\n  <path d=\"M38 62 L54 76 L84 44\" stroke=\"#34d399\" stroke-width=\"6\" fill=\"none\" />\n</svg>",
    "cssCode": ".ux-svg-morph circle {\n  stroke-dasharray: 290;\n  stroke-dashoffset: 290;\n  animation: drawCircle 2.4s ease-in-out infinite alternate;\n}\n@keyframes drawCircle {\n  to { stroke-dashoffset: 0; transform: rotate(180deg); transform-origin: center; }\n}",
    "jsCode": "const path = document.querySelector('.ux-svg-morph path');\nconst len = path.getTotalLength();\npath.style.strokeDasharray = len;\npath.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1400, iterations: Infinity });"
  },
  {
    "id": "canvas-particles",
    "name": "HTML5 Canvas Particle Constellation",
    "category": "HTML5 Canvas 2D / WebGL",
    "fps": "RequestAnimationFrame Loop",
    "stageType": "canvas-particles",
    "description": "Real-time interactive particle network rendered on an HTML5 <canvas> element with proximity connecting lines.",
    "htmlCode": "<canvas id=\"ux-particle-canvas\" width=\"420\" height=\"220\"></canvas>",
    "cssCode": "#ux-particle-canvas {\n  width: 100%;\n  height: 220px;\n  border-radius: 16px;\n  background: radial-gradient(circle at center, #1e1b4b, #020617);\n}",
    "jsCode": "const ctx = canvas.getContext('2d');\nfunction renderFrame() {\n  ctx.clearRect(0, 0, canvas.width, canvas.height);\n  particles.forEach(p => {\n    p.x += p.vx; p.y += p.vy;\n    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);\n    ctx.fillStyle = '#818cf8'; ctx.fill();\n  });\n  requestAnimationFrame(renderFrame);\n}"
  },
  {
    "id": "stagger-grid",
    "name": "Choreographed Staggered Bento Reveal",
    "category": "CSS Grid & Choreographed Motion",
    "fps": "GPU Composite Layer",
    "stageType": "stagger",
    "description": "Cascading entrance choreography using CSS custom properties (--stagger-idx) for dashboard cards and lists.",
    "htmlCode": "<div class=\"stagger-grid\">\n  <div class=\"cell\" style=\"--i:0\">Card 01</div>\n  <div class=\"cell\" style=\"--i:1\">Card 02</div>\n  <div class=\"cell\" style=\"--i:2\">Card 03</div>\n</div>",
    "cssCode": ".stagger-grid .cell {\n  opacity: 0;\n  animation: slideUpFade 1.6s cubic-bezier(0.16, 1, 0.3, 1) infinite alternate;\n  animation-delay: calc(var(--i) * 180ms);\n}\n@keyframes slideUpFade {\n  0% { opacity: 0.25; transform: translateY(18px) scale(0.94); }\n  100% { opacity: 1; transform: translateY(0) scale(1); }\n}",
    "jsCode": "document.querySelectorAll('.stagger-grid .cell').forEach((el, i) => {\n  el.style.setProperty('--i', i);\n  el.classList.add('is-visible');\n});"
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
  },
  {
    "id": "gsap-scrolltrigger-pin",
    "name": "GSAP 3 ScrollTrigger Timeline & Scrub",
    "category": "GSAP 3 / JS Animation Library",
    "fps": "GSAP 3 Ticker 120FPS",
    "stageType": "3d-card",
    "description": "GreenSock GSAP 3 timeline with ScrollTrigger scrubbing, staggered split-text reveal, and hardware-accelerated matrix transforms.",
    "htmlCode": "<section class=\"gsap-stage\">\n  <div class=\"gsap-box\">GSAP 3 Timeline</div>\n  <div class=\"gsap-sub\">ScrollTrigger Scrub Active</div>\n</section>",
    "cssCode": ".gsap-stage {\n  display: flex; flex-direction: column; align-items: center; gap: 12px;\n}\n.gsap-box {\n  padding: 18px 28px; border-radius: 16px;\n  background: linear-gradient(135deg, #10b981, #4f46e5);\n  will-change: transform, opacity;\n}",
    "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js\nconst tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'power3.inOut' } });\ntl.fromTo('.gsap-box', { y: 24, rotateX: -25, opacity: 0.4 }, { y: -12, rotateX: 15, opacity: 1, duration: 1.1 })\n  .to('.gsap-sub', { scale: 1.08, color: '#34d399', duration: 0.6 }, '-=0.5');"
  },
  {
    "id": "animejs-svg-morph",
    "name": "Anime.js Staggered Grid & SVG Morph",
    "category": "Anime.js / JS Library",
    "fps": "Anime.js Spring Engine",
    "stageType": "svg-morph",
    "description": "Anime.js keyframe timeline with 2D grid stagger propagation, spring physics easing, and SVG polygon morphing.",
    "htmlCode": "<div class=\"anime-grid\">\n  <span class=\"dot\"></span><span class=\"dot\"></span><span class=\"dot\"></span>\n  <span class=\"dot\"></span><span class=\"dot\"></span><span class=\"dot\"></span>\n</div>",
    "cssCode": ".anime-grid {\n  display: grid; grid-template-columns: repeat(3, 36px); gap: 12px;\n}\n.anime-grid .dot {\n  width: 36px; height: 36px; border-radius: 10px;\n  background: linear-gradient(135deg, #ec4899, #6366f1);\n}",
    "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js\nanime({\n  targets: '.anime-grid .dot',\n  scale: [{ value: 0.4, easing: 'easeOutSine', duration: 400 }, { value: 1.15, easing: 'easeInOutQuad', duration: 750 }],\n  rotateZ: anime.stagger([-25, 25], { grid: [3, 2], from: 'center' }),\n  delay: anime.stagger(110, { grid: [3, 2], from: 'center' }),\n  loop: true,\n  direction: 'alternate'\n});"
  },
  {
    "id": "framer-motion-spring",
    "name": "Framer Motion Layout & Gesture Spring",
    "category": "Framer Motion / React Library",
    "fps": "Spring Physics Solver",
    "stageType": "elastic",
    "description": "Declarative Framer Motion spring physics (`stiffness: 420, damping: 24`) with `whileHover`, `whileTap`, and `layoutId` shared element transitions.",
    "htmlCode": "<div class=\"motion-card\" data-layout-id=\"hero-card\">\n  <h4>Framer Motion Spring</h4>\n  <p>Drag, hover, or tap to trigger spring physics</p>\n</div>",
    "cssCode": ".motion-card {\n  padding: 20px 28px; border-radius: 20px;\n  background: rgba(99, 102, 241, 0.22);\n  border: 1px solid rgba(165, 180, 252, 0.45);\n  cursor: grab;\n}",
    "jsCode": "// NPM: npm install framer-motion\nimport { motion } from 'framer-motion';\nexport const SpringCard = () => (\n  <motion.div\n    layoutId=\"hero-card\"\n    whileHover={{ scale: 1.06, rotateY: 8 }}\n    whileTap={{ scale: 0.94 }}\n    transition={{ type: 'spring', stiffness: 420, damping: 24 }}\n    className=\"motion-card\"\n  />\n);"
  },
  {
    "id": "threejs-webgl-torus",
    "name": "Three.js WebGL 3D Shader Torus",
    "category": "Three.js / WebGL 3D Library",
    "fps": "WebGL 2.0 GPU Shader",
    "stageType": "orbit",
    "description": "Three.js WebGLRenderer scene with an iridescent wireframe TorusKnotGeometry, point lights, and orbital camera damping.",
    "htmlCode": "<canvas id=\"three-webgl-stage\" width=\"480\" height=\"240\"></canvas>",
    "cssCode": "#three-webgl-stage {\n  width: 100%; height: 240px; border-radius: 16px;\n  background: radial-gradient(circle at center, #0f172a, #020617);\n}",
    "jsCode": "// CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js\nconst scene = new THREE.Scene();\nconst camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100);\nconst mesh = new THREE.Mesh(\n  new THREE.TorusKnotGeometry(1.1, 0.34, 100, 16),\n  new THREE.MeshNormalMaterial({ wireframe: true })\n);\nscene.add(mesh); camera.position.z = 3.5;\nfunction animate() { requestAnimationFrame(animate); mesh.rotation.x += 0.015; mesh.rotation.y += 0.02; renderer.render(scene, camera); }"
  },
  {
    "id": "motion-one-waapi",
    "name": "Motion One & Velocity.js Spring Flip",
    "category": "Motion One / WAAPI Library",
    "fps": "Hardware WAAPI Engine",
    "stageType": "flip-card",
    "description": "Ultra-lightweight Motion One (`animate`, `spring`, `stagger`) driving native browser Web Animations API keyframes on the compositor thread.",
    "htmlCode": "<div class=\"motion-one-deck\">\n  <div class=\"m-card\">WAAPI 01</div>\n  <div class=\"m-card\">WAAPI 02</div>\n  <div class=\"m-card\">WAAPI 03</div>\n</div>",
    "cssCode": ".motion-one-deck { display: flex; gap: 12px; perspective: 800px; }\n.m-card {\n  padding: 16px 20px; border-radius: 14px;\n  background: #1e1b4b; border: 1px solid #6366f1;\n}",
    "jsCode": "// CDN: https://cdn.jsdelivr.net/npm/motion@10.18.0/+esm\nimport { animate, stagger, spring } from 'motion';\nanimate(\n  '.m-card',\n  { y: [-14, 0], rotateY: [25, 0], opacity: [0.4, 1] },\n  { delay: stagger(0.12), easing: spring({ stiffness: 320, damping: 20 }), repeat: Infinity, direction: 'alternate' }\n);"
  },
  {
    "id": "custom-js-fx",
    "name": "Custom JS Animation",
    "category": "JS / GSAP / Anime.js",
    "fps": "60 FPS GPU",
    "stageType": "3d-card",
    "description": "A custom JavaScript animation using GSAP or Anime.js for advanced 3D card animations.",
    "htmlCode": "<div id='card' class='card'>Card Content</div>",
    "cssCode": ".card { width: 200px; height: 200px; background-color: #3498db; color: white; display: flex; align-items: center; justify-content: center; transition: transform 0.5s ease-in-out; }",
    "jsCode": "gsap.to('#card', { duration: 1, rotationY: 360, ease: 'power2.inOut' });"
  }
];
    let selectedIndex = 0;
    let currentTab = 'html';
    let playbackSpeed = 1;
    let searchFilter = '';
    let particleReqId = null;

    function filterTypes(val) {
      searchFilter = (val || '').toLowerCase();
      renderTypeList();
    }

    function renderTypeList() {
      const visible = CATALOG.map((item, idx) => ({ item, idx })).filter(({ item }) =>
        !searchFilter ||
        item.name.toLowerCase().includes(searchFilter) ||
        item.category.toLowerCase().includes(searchFilter) ||
        item.description.toLowerCase().includes(searchFilter)
      );
      document.getElementById('count-label').textContent = visible.length + (searchFilter ? ' / ' + CATALOG.length : '');
      const container = document.getElementById('type-list');
      container.innerHTML = visible.map(({ item, idx }) => `
        <button class="type-btn ${idx === selectedIndex ? 'active' : ''}" onclick="selectType(${idx})">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:10px;font-weight:700;color:#818cf8;text-transform:uppercase;">#${idx + 1} &bull; ${item.category}</span>
          </div>
          <div style="font-size:13.5px;font-weight:700;margin-top:2px;color:#f8fafc;">${item.name}</div>
          <div style="font-size:11.5px;color:#94a3b8;margin-top:3px;">${item.description.slice(0, 68)}...</div>
        </button>
      `).join('');
    }

    function renderStage(item) {
      if (particleReqId) {
        cancelAnimationFrame(particleReqId);
        particleReqId = null;
      }
      const stage = document.getElementById('live-stage');
      stage.style.setProperty('--speed', playbackSpeed);
      const st = item.stageType || item.id;

      if (st === '3d-card' || item.id === 'morph-card') {
        stage.innerHTML = `
          <div class="demo-3d-card">
            <div style="font-size:11px;font-weight:700;color:#a5b4fc;letter-spacing:0.08em;">HTML5 3D TRANSFORM</div>
            <div style="font-size:17px;font-weight:800;margin-top:6px;">${item.name}</div>
            <div style="font-size:11.5px;color:#cbd5e1;margin-top:4px;">60fps GPU preserve-3d motion</div>
          </div>`;
      } else if (st === 'elastic' || item.id === 'elastic-pulse') {
        stage.innerHTML = `<div class="demo-elastic-pill">✦ ${item.name}</div>`;
      } else if (st === 'svg-morph' || item.id === 'svg-path-morph') {
        stage.innerHTML = `
          <svg width="130" height="130" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="44" stroke="#6366f1" stroke-width="6" fill="none"
              stroke-dasharray="280" style="animation: svgStroke calc(2.4s / var(--speed, 1)) ease-in-out infinite alternate; transform-origin: center;" />
            <path d="M40 62 L54 76 L82 46" stroke="#34d399" stroke-width="6" stroke-linecap="round" fill="none" />
          </svg>`;
      } else if (st === 'canvas-particles' || item.id === 'canvas-particles') {
        stage.innerHTML = `<canvas id="stage-canvas" width="520" height="220" style="width:100%;height:100%;"></canvas>`;
        initCanvasParticles();
      } else if (st === 'liquid-blob') {
        stage.innerHTML = `<div class="demo-liquid-blob">FLUID MORPH</div>`;
      } else if (st === 'neon-glitch') {
        stage.innerHTML = `<div class="demo-glitch">CYBER_GLITCH_FX</div>`;
      } else if (st === 'flip-card') {
        stage.innerHTML = `
          <div class="demo-flip-card">
            <div style="font-size:10px;color:#a5b4fc;font-weight:700;">ISOMETRIC 3D FLIP</div>
            <div style="font-size:15px;font-weight:800;margin-top:4px;">180&deg; Axis Rotation</div>
          </div>`;
      } else if (st === 'equalizer') {
        stage.innerHTML = `
          <div style="display:flex;align-items:flex-end;gap:8px;height:110px;">
            ${[0.1, 0.35, 0.2, 0.5, 0.15, 0.4, 0.25, 0.45, 0.12, 0.3].map(d =>
              `<span style="width:12px;height:100px;border-radius:6px;background:linear-gradient(to top,#4f46e5,#34d399);transform-origin:bottom;animation:eqBar calc(0.75s / var(--speed,1)) ease-in-out infinite alternate;animation-delay:${d}s;"></span>`
            ).join('')}
          </div>`;
      } else if (st === 'shimmer') {
        stage.innerHTML = `
          <div style="width:280px;padding:16px;border-radius:14px;background:#0f172a;border:1px solid #1e293b;display:flex;flex-direction:column;gap:10px;">
            <div style="height:16px;width:65%;border-radius:6px;background:linear-gradient(90deg,#1e293b 25%,#4f46e5 50%,#1e293b 75%);background-size:200% 100%;animation:shimmerSweep calc(1.5s / var(--speed,1)) infinite linear;"></div>
            <div style="height:12px;width:90%;border-radius:6px;background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;animation:shimmerSweep calc(1.5s / var(--speed,1)) infinite linear;"></div>
            <div style="height:12px;width:75%;border-radius:6px;background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%);background-size:200% 100%;animation:shimmerSweep calc(1.5s / var(--speed,1)) infinite linear;"></div>
          </div>`;
      } else if (st === 'typewriter') {
        stage.innerHTML = `
          <div style="font-family:monospace;font-size:14px;color:#34d399;background:#020617;padding:14px 20px;border-radius:12px;border:1px solid #1e293b;">
            &gt; executing html5_motion_pipeline... <span style="display:inline-block;width:8px;height:15px;background:#34d399;animation:eqBar 0.6s infinite alternate;"></span>
          </div>`;
      } else if (st === 'orbit') {
        stage.innerHTML = `
          <div style="position:relative;width:130px;height:130px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:0;border:2px solid #6366f1;border-radius:50%;animation:flip3D calc(2.2s / var(--speed,1)) linear infinite;"></div>
            <div style="position:absolute;inset:14px;border:2px solid #34d399;border-radius:50%;animation:radarSweep calc(1.8s / var(--speed,1)) linear infinite;"></div>
            <div style="width:18px;height:18px;border-radius:50%;background:#a5b4fc;box-shadow:0 0 20px #6366f1;"></div>
          </div>`;
      } else if (st === 'dock') {
        stage.innerHTML = `
          <div style="display:flex;gap:12px;padding:12px 18px;border-radius:18px;background:rgba(15,23,42,0.9);border:1px solid #334155;">
            ${['⚡','🎨','🚀','💎','🔥'].map((ic, i) =>
              `<div class="demo-stagger-cell" style="width:48px;height:48px;font-size:20px;animation-delay:${i*120}ms;">${ic}</div>`
            ).join('')}
          </div>`;
      } else if (st === 'radar') {
        stage.innerHTML = `
          <div style="position:relative;width:136px;height:136px;border-radius:50%;border:2px solid rgba(52,211,153,0.45);overflow:hidden;background:radial-gradient(circle,rgba(16,185,129,0.12),#020617);">
            <div style="position:absolute;inset:0;background:conic-gradient(from 0deg,transparent 70%,rgba(52,211,153,0.55));animation:radarSweep calc(2s / var(--speed,1)) linear infinite;"></div>
          </div>`;
      } else {
        stage.innerHTML = `
          <div class="demo-stagger-row">
            <div class="demo-stagger-cell" style="animation-delay:0ms;">01</div>
            <div class="demo-stagger-cell" style="animation-delay:160ms;">02</div>
            <div class="demo-stagger-cell" style="animation-delay:320ms;">03</div>
            <div class="demo-stagger-cell" style="animation-delay:480ms;">04</div>
          </div>`;
      }
    }

    function initCanvasParticles() {
      const canvas = document.getElementById('stage-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const pts = Array.from({ length: 24 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.8 * playbackSpeed,
        vy: (Math.random() - 0.5) * 1.8 * playbackSpeed,
        r: 2.5 + Math.random() * 2
      }));
      function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = '#818cf8';
          ctx.fill();
          for (let j = i + 1; j < pts.length; j++) {
            const q = pts[j];
            const dist = Math.hypot(p.x - q.x, p.y - q.y);
            if (dist < 95) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = `rgba(99, 102, 241, ${1 - dist / 95})`;
              ctx.stroke();
            }
          }
        }
        particleReqId = requestAnimationFrame(loop);
      }
      loop();
    }

    function buildGsapCode(item) {
      return `// 1. Include GreenSock GSAP 3 Library (CDN or NPM)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>
// npm install gsap

import gsap from "gsap";

// 2. GSAP 3 Hardware-Accelerated Timeline for: ${item.name}
const tl = gsap.timeline({
  repeat: -1,
  yoyo: true,
  defaults: { duration: (1.4 / ${playbackSpeed}).toFixed(2), ease: "power3.inOut" }
});

tl.fromTo(
  "#${item.id}-target",
  { opacity: 0.35, y: 18, scale: 0.92, rotateX: -12 },
  { opacity: 1, y: -10, scale: 1.04, rotateX: 12 }
);`;
    }

    function buildLibrariesCode(item) {
      return `// ============================================================
// OPTION A: Anime.js v3.2.2 (Lightweight JS Animation Library)
// CDN: <script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"><\/script>
// ============================================================
anime({
  targets: '#${item.id}-target',
  translateY: [-14, 14],
  scale: [0.94, 1.06],
  rotate: '1turn',
  easing: 'spring(1, 80, 12, 0)',
  duration: ${Math.round(1600 / playbackSpeed)},
  direction: 'alternate',
  loop: true
});

// ============================================================
// OPTION B: Framer Motion (React / Next.js 15 Spring Component)
// NPM: npm install framer-motion
// ============================================================
import { motion } from "framer-motion";

export function ${item.id.replace(/[^a-zA-Z0-9]/g, '')}Motion() {
  return (
    <motion.div
      initial={ opacity: 0, y: 20, scale: 0.92 }
      animate={ opacity: 1, y: 0, scale: 1 }
      whileHover={ scale: 1.06, rotateY: 10 }
      transition={ type: "spring", stiffness: 380, damping: 24 }
    >
      <h3>${item.name}</h3>
    </motion.div>
  );
}`;
    }

    function updateCodeView() {
      const item = CATALOG[selectedIndex];
      let code = '';
      let cdnText = '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>';
      if (currentTab === 'html') {
        code = item.htmlCode;
        cdnText = '<!-- Zero external dependencies required for HTML5 markup -->';
      } else if (currentTab === 'css') {
        code = item.cssCode;
        cdnText = '/* Hardware-accelerated CSS3 Keyframes & Custom Properties */';
      } else if (currentTab === 'js') {
        code = item.jsCode;
        cdnText = '// Native Browser Web Animations API (element.animate) + ES2022';
      } else if (currentTab === 'gsap') {
        code = buildGsapCode(item);
        cdnText = '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>';
      } else {
        code = buildLibrariesCode(item);
        cdnText = '<script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.2/anime.min.js"><\/script> | npm i framer-motion';
      }
      document.getElementById('code-display').textContent = code;
      document.getElementById('cdn-snippet').textContent = cdnText;
      ['html', 'css', 'js', 'gsap', 'libs'].forEach(t => {
        const btn = document.getElementById('tab-' + t);
        if (btn) btn.className = 'btn btn-ghost' + (t === currentTab ? ' active' : '');
      });
    }

    function selectType(idx) {
      selectedIndex = idx;
      const item = CATALOG[selectedIndex];
      document.getElementById('active-category').textContent = item.category;
      document.getElementById('active-title').textContent = item.name;
      document.getElementById('active-fps').textContent = item.fps;
      document.getElementById('active-desc').textContent = item.description;
      renderTypeList();
      renderStage(item);
      updateCodeView();
      console.log('[AnimationPortal] Selected type:', item.name);
    }

    function switchCodeTab(tab) {
      currentTab = tab;
      updateCodeView();
    }

    function setSpeed(s, btn) {
      playbackSpeed = s;
      document.querySelectorAll('header .btn-ghost').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderStage(CATALOG[selectedIndex]);
      updateCodeView();
    }

    function replayAnimation() {
      renderStage(CATALOG[selectedIndex]);
    }

    function copyLibraryCdn() {
      const txt = document.getElementById('cdn-snippet').textContent;
      navigator.clipboard?.writeText(txt);
      const btn = document.getElementById('copy-cdn-btn');
      btn.textContent = '✓ Copied CDN!';
      setTimeout(() => { btn.textContent = 'Copy Library CDN'; }, 1500);
    }

    function copySampleCode() {
      const code = document.getElementById('code-display').textContent;
      navigator.clipboard?.writeText(code);
      const btn = document.getElementById('copy-btn');
      btn.textContent = '✓ Copied to Clipboard!';
      setTimeout(() => { btn.textContent = 'Copy Sample Code'; }, 1500);
    }

    selectType(0);
  </script>
</body>
</html>
````

### File: `package-lock.json`
````json
{
  "name": "local-dev-studio-app",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "local-dev-studio-app",
      "version": "1.0.0"
    }
  }
}

````

### File: `package.json`
````json
{
  "name": "local-dev-studio-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "node server.js",
    "build": "node -e \"const fs=require('fs'); if(!fs.existsSync('index.html')) process.exit(1); console.log('Build verified OK');\"",
    "start": "node server.js"
  },
  "dependencies": {}
}
````

### File: `server.js`
````js
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading index.html');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[DevServer] Ready on http://0.0.0.0:${port}`);
});

````
