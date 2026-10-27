# VibeForge — Comprehensive Technical & Functional Architecture Pitch Deck

> [!IMPORTANT]
> **Executive Positioning**: **VibeForge** is a privacy-first, local-native AI Software Engineering Studio that unifies a **Bundled Local LLM Runtime (`llama.cpp` + `Qwen2.5-Coder-7B-Instruct-GGUF`)**, a **Domain-Adaptive Autonomous Coding Agent**, a **124-Skill Architectural Registry (`SKILL.md`)** with **Per-Workspace Selected Skills Management**, **Monaco Side-by-Side Diff Verification**, **Xterm.js WebSocket Terminal Streaming**, and **Bounded Docker Micro-Container Sandboxes** into a single zero-data-exfiltration platform.

### ⚡ Core Technical Stack & Local LLM Architecture at a Glance (1-Line Reference)

| Layer / Component | Implementation | 1-Line Technical Purpose |
| :--- | :--- | :--- |
| **Bundled Local LLM Server** | `llama-server.exe` (`llama.cpp` CPU AVX2, `-b 1024 -ub 512`) | Serves local OpenAI-compatible `/v1/chat/completions` inference on `127.0.0.1:8080` with zero external setup. |
| **Local Coding Model** | `Qwen2.5-Coder-7B-Instruct-GGUF` (`Q4_K_M`, `4.68 GB`, `7.61B` params) | Synthesizes domain-aligned HTML5, Tailwind CSS, GSAP/Anime.js/Framer Motion, Chart.js, and React/Next.js apps (`-c 8192`). |
| **Local LLM Auto-Manager** | [`LocalLLMManager`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/backend/app/agent/local_llm_manager.py) | Auto-discovers `llama.cpp` (`:8080`), Ollama (`:11434`), or LM Studio (`:1234`) and spawns the strongest local GGUF model (`7B` $\rightarrow$ `3B`). |
| **Autonomous Coding Agent** | [`CodingAgent`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/backend/app/agent/coding_agent.py) | Executes the 6-stage agentic loop (Context Ingestion $\rightarrow$ Domain-Gated Synthesis $\rightarrow$ Diff Patch $\rightarrow$ Build $\rightarrow$ Self-Heal). |
| **Domain-Gated Runtime Layer** | `_repair_and_enrich_html` (`__ENABLE_TABULAR_ENHANCER`) | Strict domain isolation: injects CSV/Excel/Chart.js handlers only on analytical apps while preserving pure UI/UX & animation studios. |
| **124-Skill Registry & Workspace Pack** | [`SkillsRegistry`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/backend/app/agent/skills_registry.py) (`SKILL.md`) | Injects 124 curated & custom architectural directives across 13 domains (including 8 `Qwen 2.5 Coder & Local LLM` skills). |
| **Selected Skills Workspace Dock** | [`AgentConsole`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/frontend/components/agent-console.tsx) & [`WorkspaceModals`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/frontend/components/workspace-git-modals.tsx) | Collapsed-by-default `Skills (N)` dock toggle (`showSelectedSkills: false`), `+ Qwen 2.5 Pack` quick-equip, and modal skill summaries. |
| **Atomic Diff & Rollback** | [`DiffEngine`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/backend/app/agent/diff_engine.py) (`.studio_backups`) | Snapshots workspace files prior to mutation, applies `SEARCH/REPLACE` blocks, and rolls back failed builds automatically. |
| **Docker Sandbox Engine** | [`SandboxDockerManager`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/backend/app/sandbox/docker_manager.py) (`node:20-alpine`) | Isolates each project in a cgroup-bounded container (`mem_limit="2g"`, `nano_cpus=2e9`) with local subprocess fallback. |
| **Backend Orchestrator** | FastAPI `0.115`, Python `3.11+`, Uvicorn, WebSockets | Exposes 18 REST endpoints (`/api/*`) and 2 real-time WebSocket channels (`/ws/agent/*`, `/ws/terminal/*`). |
| **Studio Frontend & IDE** | Next.js `15`, React `18.3`, Zustand, Monaco, Xterm.js, Framer Motion | Multi-pane reactive IDE with 4 theme tones, side-by-side `DiffEditor`, live viewport, and GPU terminal. |

````carousel
![Slide 1: VibeForge Primary Studio Interface (Obsidian Pro) — Skills Dock Collapsed by Default on Load + 21-Animation Studio & 5-Tab Code Generation Window](C:/Users/Admin/.gemini/antigravity/brain/1d1a632e-9381-43c6-ba1f-46420ad54cfa/vibeforge_pitch_01_overview.png)
<!-- slide -->
![Slide 2: Expanded "Selected Skills in Workspace" Drawer (+ Qwen 2.5 Pack) & Live GSAP 3 / Anime.js / Framer Motion Code Generation Tabs](C:/Users/Admin/.gemini/antigravity/brain/1d1a632e-9381-43c6-ba1f-46420ad54cfa/vibeforge_pitch_10_selected_skills_drawer.png)
<!-- slide -->
![Slide 3: Domain-Adaptive Local LLM Synthesis (`Qwen2.5-Coder-7B-Instruct`) Generating a Live CSV/Excel Analytical Dashboard](C:/Users/Admin/.gemini/antigravity/brain/1d1a632e-9381-43c6-ba1f-46420ad54cfa/vibeforge_pitch_09_local_llm_analytics.png)
````

---

## 1. The Engineering Problem & VibeForge Solution

| Industry Bottleneck | Legacy Cloud AI Builders | The VibeForge Architecture |
| :--- | :--- | :--- |
| **1. Prompt-Blind or Cross-Contaminated Templates** | Heuristic builders either match keywords against static templates or leak dashboard boilerplate into non-analytics apps. | **Domain-Adaptive `Qwen2.5-Coder-7B-Instruct` Synthesis**: [`CodingAgent`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/backend/app/agent/coding_agent.py) classifies prompt intent and workspace state—synthesizing pure 21-animation interactive studios with 5-tab library code generators or full CSV/Excel analytical suites with strict domain isolation (`window.__ENABLE_TABULAR_ENHANCER`). |
| **2. Context Destruction on Follow-Ups** | One-shot generators overwrite existing files on Prompt #2+, losing custom state, components, and user edits. | **Incremental Context-Aware Evolution**: [`_read_workspace_context()`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/backend/app/agent/coding_agent.py) ingests up to `45,000` chars per workspace file before every run, preserving and extending existing architecture across turns. |
| **3. Unverified Code & Broken Builds** | Raw LLM output is dumped into the file tree without dependency verification or compiler validation. | **3-Iteration Self-Healing Build Loop**: [`CodingAgent.execute_task()`](file:///c:/GITs/AGs/Local%20Bolt/local-dev-studio/backend/app/agent/coding_agent.py) runs `npm install` + `npm run build` inside the sandbox and feeds `stderr` traces back to the LLM to self-repair. |
| **4. Cloud Data Exfiltration** | Source code, `.env` secrets, and proprietary prompts are transmitted to multi-tenant third-party cloud APIs. | **100% Local-First Execution**: Runs entirely on local hardware via the bundled `llama.cpp` `Qwen2.5-Coder-7B` engine, Ollama, or LM Studio inside bounded Docker `node:20-alpine` containers. |

---

## 2. Deep-Dive Functional Capabilities & UI/UX Architecture

### 2.1 Bundled `Qwen2.5-Coder-7B` Runtime, Domain-Adaptive Evolution & 5-Tab Code Generation
- **Automatic Strongest-Model Selection (`7B` $\rightarrow$ `3B`)**: `LocalLLMManager.list_local_gguf_models()` automatically selects `qwen2.5-coder-7b-instruct-q4_k_m.gguf` (`7.61B` parameters, `8192` context window, `-b 1024 -ub 512` batching) and exposes live health telemetry (`GET /api/llm/status`).
- **21-Animation Studio & 5-Tab Code Generation Window**: In UI/Animation workspaces (`default`), follow-up prompts dynamically append Qwen2.5-Coder-7B custom animations alongside **20 curated CSS3/WAAPI/GSAP/Anime.js/Framer Motion/Three.js animations** and provide a live **5-Tab Code Generation Window**:
  1. `HTML5 Markup`
  2. `CSS3 Keyframes`
  3. `JavaScript (WAAPI)`
  4. `GSAP 3 Library` (with `gsap.fromTo()` & `ScrollTrigger` code + CDN `<script>` tag)
  5. `Anime.js / Framer Motion` (side-by-side `anime({...})` and `<motion.div>` spring physics + one-click `Copy Library CDN`)
- **Domain-Gated Analytical Engine**: When a prompt targets CSV, Excel, or tabular data (`analytics-app`), `_repair_and_enrich_html` sets `window.__ENABLE_TABULAR_ENHANCER = true`, enabling interactive CSV/TSV/JSON file upload, raw tabular paste, dynamic Chart.js `4.4.1` visualization, and live KPI recalculation.

---

### 2.2 The 124-Skill Architectural Registry & Per-Workspace Selected Skills UI

| Category | Count | Representative Skills & Injected Architectural Directives |
| :--- | :---: | :--- |
| **1. Qwen 2.5 Coder & Local LLM** *(New)* | `8` | `qwen25-coder-7b-mastery`, `qwen-csv-excel-analytics-engine`, `qwen-reactive-tailwind-chartjs`, `qwen-multi-turn-context-evolver`, `qwen-self-healing-compiler-loop`, `qwen-local-gguf-kv-cache`, `qwen-interactive-simulation-canvas`, `qwen-enterprise-crud-state-machine` |
| **2. UI/UX & Design Systems** | `12` | `ui-ux-pro-max-skill`, `tailwind-shadcn-radix`, `macos-floating-dock-ui`, `linear-precision-dark-ui` |
| **3. Animation, 3D & Shaders** | `10` | `framer-motion-physics`, `threejs-r3f-webgl`, `gsap-scrolltrigger-timelines`, `webgl-glsl-aurora-shaders` |
| **4. Frontend Architecture** | `10` | `nextjs-15-app-router`, `zustand-immer-state`, `tanstack-query-v5`, `pwa-offline-service-worker` |
| **5. Data & Analytics** | `8` | `d3-recharts-analytics`, `tanstack-table-virtualized`, `mapbox-deckgl-geospatial`, `financial-ohlc-candlestick` |
| **6. Backend & APIs** | `10` | `fastapi-async-pydantic-v2`, `websocket-sse-streaming`, `graphql-apollo-federation`, `bullmq-redis-job-queues` |
| **7. Database & Storage** | `8` | `postgres-prisma-drizzle`, `supabase-pgvector-rls`, `redis-caching-rate-limiter`, `elasticsearch-meilisearch-fts` |
| **8. AI & Autonomous Agents** | `10` | `local-ollama-vllm-connector`, `rag-hybrid-vector-rerank`, `langgraph-multi-agent-orchestrator`, `mcp-tool-server-builder` |
| **9. Security, Auth & Testing** | `8` | `oauth2-passkeys-webauthn`, `owasp-csp-input-sanitizer`, `playwright-e2e-visual-regression`, `vitest-msw-unit-testing` |
| **10. DevOps, Cloud & Sandbox** | `8` | `docker-multi-stage-alpine`, `github-actions-ci-cd`, `prometheus-grafana-observability`, `nginx-reverse-proxy-tls` |
| **11. SaaS & Product Patterns** | `8` | `stripe-billing-webhooks`, `multi-tenant-saas-onboarding`, `kanban-drag-drop-board`, `realtime-collaborative-canvas` |
| **12. Built-In Agent Skills** | `24` | Auto-discovered from `.agents/skills/*/SKILL.md` and `~/.gemini/*/skills/*/SKILL.md` |
| **13. Custom User Skills** | Dynamic | Users can author custom skills directly in the modal (`custom_skills.json` + `.agents/skills/<id>/SKILL.md`). |
