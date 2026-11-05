---
name: NextGen UI — Spatial Glass & Kinetic Workbench Architecture
description: NextGen UI (nextgen-ui) design system and workbench architecture inspired by Linear, Cursor, Raycast, and Arc Browser. Enforces Spatial Obsidian glass surfaces, 1px specular hairlines, Tubelight segmented command bars, collapsible activity rails, floating glass prompt omniboxes, and tabular telemetry status bars.
---

# NextGen UI (`nextgen-ui`) — Spatial Glass & Kinetic Workbench Skill

## 1. Core Architectural Pillars
1. **Spatial Obsidian & Specular Liquid Glass Surfaces**:
   - Base Canvas: `#03050c` with subtle radial aurora spotlight (`radial-gradient(circle at 18% 0%, rgba(99, 102, 241, 0.15), transparent 42%), radial-gradient(circle at 82% 8%, rgba(6, 182, 212, 0.11), transparent 38%)`).
   - Elevated Glass Panels: `rgba(9, 13, 24, 0.88)` with `backdrop-filter: blur(20px)`, `1px solid rgba(255, 255, 255, 0.085)` structural hairlines, and a `1px` top-edge specular highlight (`inset 0 1px 0 0 rgba(255, 255, 255, 0.12)`).
2. **Tubelight Segmented Command & Workbench Bar**:
   - Center-pinned segmented mode switcher with a luminous top tubelight indicator (`linear-gradient(90deg, #6366f1, #22d3ee, #a855f7)`) and Framer Motion spring layout transitions (`stiffness: 380, damping: 30`).
3. **Collapsible Multi-Pane Workbench Ergonomics**:
   - Supports seamless switching between **Split Studio** (Agent + Preview), **Code + Preview IDE** (Agent + Monaco + Preview), **Code Focus** (Agent + Full-Width Monaco), and **Preview Cinema** (Collapsed Activity Rail + 96% Full-Canvas Preview).
4. **Floating Glass Prompt Omnibox & Quick-Starter Pills**:
   - Multi-layered prompt composer with focus border-beam glow, keyboard shortcut kbd badges (`↵`, `⇧↵`, `⌘K`), and 1-click starter blueprint pills on clean workspaces.
5. **Arc-Style Interactive URL Pill & IDE Telemetry Status Footer**:
   - Interactive URL omnibar with 1-click copy, Cinema mode toggle, and a `26px` bottom telemetry bar surfacing container mode, active workspace, CuriousLLM hops, and quick drawer toggles.
