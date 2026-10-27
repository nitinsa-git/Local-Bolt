---
name: nav-bar-gallery
description: Curated Navigation Bar Gallery skill featuring 5 modern enterprise and interactive navigation patterns (Tubelight Segmented Command Bar, Hybrid Collapsible Rail + Top Ribbon, Top Glassmorphic Full-Canvas Ribbon, Floating macOS Magnetic Dock, and Breadcrumb Telemetry Bar). Use when designing or upgrading navigation bars for SaaS, allocation, and enterprise dashboard applications.
---

# Nav-Bar Gallery Skill (`nav-bar-gallery`)

## 1. Overview & Selection Matrix
When building or upgrading an application's navigation system, select the pattern from the **Nav-Bar Gallery** that best aligns with the application's domain, screen density, and workflow frequency:

| Pattern ID | Pattern Name | Best Aligned Use Case | Key Visual Signature |
| :--- | :--- | :--- | :--- |
| **1. `tubelight-hybrid`** *(Recommended for Enterprise / Allocation Apps)* | **Executive Tubelight Command Bar + Collapsible Sidebar** | Operational & resource-allocation platforms (`CLAMS`, ERP, CMDB) with 4–8 core screens plus live daily slot/status counters. | Left collapsible dark rail (`#020617`) paired with a sticky top glass command bar featuring a center **Tubelight Segmented Pill Switcher** (glowing top lamp indicator on active tab) and right-aligned live telemetry + action CTAs. |
| **2. `top-glass-ribbon`** | **Top-Only GlassTubelight Ribbon (Full-Width Canvas)** | Data-dense schedules, 10-day capacity timelines, and wide multi-column tables where 100% horizontal viewport width is needed. | Hides the vertical sidebar and surfaces all primary & admin tabs in a dual-group horizontal pill ribbon with instant 1-click switching. |
| **3. `floating-macos-dock`** | **Floating macOS Magnetic Pill Dock** | Quick-action studio workflows and presentation/kiosk views. | Bottom-centered frosted glass dock (`backdrop-filter: blur(20px)`) with spring hover magnification (`scale(1.12)`) and badge counters. |

## 2. Core Implementation Rules for Allocation & Operational Apps
1. **Tubelight Active Pill Indicator**:
   - The active navigation pill displays a luminous top indicator bar (`height: 3px; background: linear-gradient(90deg, #6366f1, #a855f7); box-shadow: 0 2px 10px rgba(99, 102, 241, 0.65)`) and subtle elevated surface (`bg-white text-indigo-700 shadow-sm`).
2. **Synchronized Multi-Surface State**:
   - Clicking any tab in the Top Tubelight Bar, Left Collapsible Sidebar, or Floating Dock updates all navigation surfaces simultaneously (`switchTab(tabId)`), auto-expanding the corresponding parent group (`Core Functions` vs `Admin Panel`).
3. **Embedded Live Telemetry & Action Cluster**:
   - Keep high-priority operational triggers (`Today's Allocations [✔ Picked | ⏳ Scheduled | ✖ No-Show]`, `Urgent Allotment`, `Allocate Laptop`) pinned in the right-hand command cluster with zero text wrapping or overflow.
4. **Interactive Nav-Bar Gallery Switcher**:
   - Provide a compact **Nav Layout Switcher (`Hybrid` | `Top Ribbon` | `Floating Dock`)** in the header so operators can switch between sidebar+top-bar hybrid mode, full-width top ribbon mode, or floating dock mode on demand.
