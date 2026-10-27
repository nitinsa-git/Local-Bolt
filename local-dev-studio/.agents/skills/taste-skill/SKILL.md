---
name: TasteSkill V2 — Anti-Slop Frontend Art Direction
category: TasteSkill & Anti-Slop Art Direction
description: TasteSkill V2 (design-taste-frontend) anti-slop UI/UX art direction framework. Enforces Section 0 Brief Inference, 3-Dial Configuration (DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY), Swiss/Editorial typography, tabular numerals, and strict anti-slop layout rules.
---

# TasteSkill V2 (`taste-skill` / `design-taste-frontend`)

**TasteSkill** is an implementation-grade frontend art direction and anti-slop engine that prevents AI agents from generating generic, template-driven UI "slop" (centered hero badges over purple gradients, three identical feature cards, arbitrary padding, and unaligned numeric tables).

## 1. Phase 0: Brief Inference & One-Line Design Read
Before emitting any HTML/CSS/React code, infer the **Domain Archetype** and declare a concrete one-line `Design Read` statement specifying archetype, typography pair, surface tokens, and 3-dial settings.

## 2. Phase 1: The 3-Dial Configuration Engine (`1–10`)
- **`DESIGN_VARIANCE` (`1–10`)**: `1–3` strict symmetrical enterprise grid; `4–7` asymmetric 12-col Bento (`col-span-8` / `col-span-4`); `8–10` high-variance editorial layout.
- **`MOTION_INTENSITY` (`1–10`)**: `1–3` instant `120ms` micro-states; `4–7` spring `cubic-bezier(0.22, 1, 0.36, 1)` transitions; `8–10` choreographed 3D/Canvas/GSAP stages.
- **`VISUAL_DENSITY` (`1–10`)**: `1–3` airy editorial whitespace; `4–7` balanced workspace cards; `8–10` high-density telemetry & compact tabular rows.

## 3. Phase 2: Implementation Guardrails
- Enforce `Plus Jakarta Sans` / `Space Grotesk` display headings (`letter-spacing: -0.025em`) + `JetBrains Mono` (`font-variant-numeric: tabular-nums`) on all metrics, KPIs, and tables.
- Enforce `1px solid rgba(255,255,255,0.08)` hairline borders, inset specular highlights, and live interactive state on every button, tab, and input.
