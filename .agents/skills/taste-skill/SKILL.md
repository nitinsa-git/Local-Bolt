---
name: TasteSkill V2 — Anti-Slop Frontend Art Direction
category: TasteSkill & Anti-Slop Art Direction
description: TasteSkill V2 (design-taste-frontend) anti-slop UI/UX art direction framework. Enforces Section 0 Brief Inference, 3-Dial Configuration (DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY), Swiss/Editorial typography, tabular numerals, and strict anti-slop layout rules.
---

# TasteSkill V2 (`taste-skill` / `design-taste-frontend`)

**TasteSkill** is an implementation-grade frontend art direction and anti-slop engine that prevents AI agents from generating generic, template-driven UI "slop" (centered hero badges over purple gradients, three identical feature cards, arbitrary padding, and unaligned numeric tables).

---

## 1. Phase 0: Brief Inference & One-Line Design Read
Before emitting any HTML/CSS/React code, infer from the user prompt and workspace context:
1. **Domain Archetype**:
   - *Executive Financial / Telemetry Terminal* (Data-dense, tabular, high-trust)
   - *Editorial Minimalist / Knowledge Workbench* (Warm monochrome, high negative space, typographic hierarchy)
   - *Interactive Creative / Motion Showcase* (Asymmetric Bento, spring choreography, hardware-accelerated stages)
   - *Modern SaaS Command Center* (Raycast/Linear precision, 1px specular borders, keyboard-first workflows)
2. **One-Line Design Read**: Emit or bind a concrete `Design Read` statement declaring the archetype, typographic pairing, surface hierarchy, and active dial settings.

---

## 2. Phase 1: The 3-Dial Configuration Engine (Scale `1–10`)

Every synthesized or refactored interface is governed by three explicit numerical dials (`1–10`):

### Dial 1: `DESIGN_VARIANCE` (`1–10`)
- **`1–3` (Strict / Symmetrical / High-Trust)**: Clean 12-column grids, predictable alignment, institutional clarity (ideal for enterprise analytics, SQL consoles, compliance & financial operations).
- **`4–7` (Balanced Asymmetric Bento)**: 12-column CSS Grid with asymmetric spans (`col-span-8` + `col-span-4`), split command headers, and segmented view switchers.
- **`8–10` (Editorial / Experimental / High-Variance)**: Offset editorial grids, architectural hairlines, oversized display typography (`tracking: -0.03em`), and non-uniform visual rhythm.

### Dial 2: `MOTION_INTENSITY` (`1–10`)
- **`1–3` (Restrained / Instantaneous)**: Crisp `120ms` state transitions on hover/focus; zero distracting background motion.
- **`4–7` (Spring Micro-Choreography)**: Hardware-accelerated `cubic-bezier(0.22, 1, 0.36, 1)` transitions, tactile button compression (`scale(0.98)`), and smooth tab indicator slides.
- **`8–10` (Kinetic / Choreographed Stage)**: Multi-layer 3D perspective transforms, GSAP / WAAPI timelines, interactive Canvas particle/shader stages, and staggered entrance reveals.

### Dial 3: `VISUAL_DENSITY` (`1–10`)
- **`1–3` (Airy / Editorial / Gallery)**: Generous padding (`24px–32px`), expansive breathing room, focused single-task surfaces (`taste-minimalist-ui`, `taste-soft-luxury`).
- **`4–7` (Balanced Product Workspace)**: Structured card padding (`16px–20px`), clear section dividers, scannable KPI strips.
- **`8–10` (High-Density Telemetry / Bloomberg / Linear)**: Compact `10px–14px` cells, high-signal status pills, monospace tabular metrics (`font-variant-numeric: tabular-nums`), multi-pane split inspectors.

---

## 3. Phase 2: Mandatory Implementation-Level Rules & Anti-Slop Guardrails

1. **Typography & Numeric Discipline**:
   - Pair geometric display headings (`Plus Jakarta Sans` or `Space Grotesk`, `letter-spacing: -0.025em`) with clean UI body text (`Inter`) and precision monospace (`JetBrains Mono`) for IDs, timestamps, code, and metrics.
   - **Mandatory Tabular Numerals**: Apply `font-variant-numeric: tabular-nums` to all KPIs, counters, tables, badges, and financial/telemetry readouts so digits never jitter on live updates.
2. **Surface & Border Craft**:
   - Never use muddy, low-contrast gray-on-gray cards or thick neon borders.
   - Use layered obsidian/slate depth (`#030712` canvas -> `#0b1120` container -> `#111827` interactive surface) with `1px solid rgba(255, 255, 255, 0.08)` hairline borders and subtle top-edge specular highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.08)`).
3. **Prohibited AI Slop Patterns**:
   - No generic "Welcome to Our Platform" centered hero with 3 identical marketing cards when the user asked for a functional tool or app.
   - No unstyled browser inputs, broken chart containers, or dead non-interactive buttons.
   - Every control, filter, tab, and dial must mutate live application state immediately.

---

## 4. Specialized Sub-Skill Variants
- **`taste-skill` (`design-taste-frontend`)**: Core adaptive V2 engine that auto-tunes `DESIGN_VARIANCE`, `MOTION_INTENSITY`, and `VISUAL_DENSITY` to the prompt's domain.
- **`taste-minimalist-ui` (`minimalist-skill`)**: Warm monochrome / high-contrast editorial minimalism (`DV=6, MI=3, VD=3`).
- **`taste-soft-luxury` (`soft-skill`)**: Calm, tactile surfaces, diffused ambient lighting, and spring physics (`DV=5, MI=6, VD=3`).
- **`taste-gpt-strict` (`gpt-tasteskill`)**: High-variance asymmetric layouts and aggressive anti-slop enforcement (`DV=8, MI=7, VD=5`).
- **`taste-redesign-audit` (`redesign-skill`)**: Audits existing workspace DOM/CSS to strip AI slop, enforce tabular numerals, upgrade spacing hierarchy, and bind live TasteSkill dial controls.
