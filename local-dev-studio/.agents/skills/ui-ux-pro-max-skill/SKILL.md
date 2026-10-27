---
name: ui-ux-pro-max-skill
description: Comprehensive UI/UX Pro Max design system and 21st.dev (21.dev) interactive website/application template architecture. Use when designing, building, or upgrading web interfaces, dashboards, interactive portals, and Framer Motion animations.
---

# UI/UX Pro Max Skill & 21st.dev Interactive Template System

## 1. Core Design Philosophy (UI/UX Pro Max)
- **Visual Hierarchy & Breathing Room**: Generous whitespace, crisp `1px solid rgba(255, 255, 255, 0.08)` hairlines, layered depth (`#020617` base canvas, `rgba(15, 23, 42, 0.72)` glass cards with `backdrop-filter: blur(16px)`).
- **Ambient Aurora & Radial Spotlight**: Mouse-reactive radial spotlight (`radial-gradient(420px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.16), transparent 60%)`) paired with subtle top-center aurora glow.
- **Typography & Micro-Contrast**: High-contrast display headings (`letter-spacing: -0.025em`, gradient text accents), muted secondary copy (`#94a3b8`), and tabular monospace telemetry badges.
- **Spring Physics Everywhere**: Every interactive control uses `framer-motion` spring physics (`stiffness: 360, damping: 28`) and tactile hover/tap feedback (`whileHover={{ scale: 1.02 }}`, `whileTap={{ scale: 0.97 }}`).

## 2. Best Interactive Templates from 21st.dev (`21.dev`)
1. **Aurora Spotlight Hero & Bento Grid (`21.dev/bento-spotlight`)**:
   - Multi-span responsive Bento cards with live cursor-tracking border glow, interactive live stage, and instant code inspection.
2. **Magnetic 3D Tilt & Floating Dock (`21.dev/floating-dock`)**:
   - macOS-style spring-magnified floating action dock + 3D perspective card with pointer-tracking `rotateX`/`rotateY` and specular glare.
3. **Animated Beam & Command Palette (`21.dev/animated-beam`)**:
   - SVG gradient energy beams connecting modular nodes with keyboard-first filter bar and real-time telemetry pills.
4. **Shimmer & Liquid Glass Interactive Cards (`21.dev/shimmer-card`)**:
   - Conic border beam buttons, skeletons with 60fps linear shimmer sweeps, and spring-draggable interactive components.
