import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field


class LLMSkill(BaseModel):
    id: str
    name: str
    category: str
    description: str
    instructions: str
    tags: List[str] = Field(default_factory=list)
    source: str = "builtin"


def _sk(
    skill_id: str,
    name: str,
    category: str,
    description: str,
    instructions: str,
    tags: List[str],
    source: str = "builtin",
) -> LLMSkill:
    return LLMSkill(
        id=skill_id,
        name=name,
        category=category,
        description=description,
        instructions=instructions,
        tags=tags,
        source=source,
    )


# Compact tuple specification to register 100+ specialized LLM & Agent skills
_RAW_SKILLS_SPEC: List[Tuple[str, str, str, str, str, List[str]]] = [
    # ==================== 1. UI/UX & Design Systems (12) ====================
    (
        "ui-ux-pro-max-skill",
        "UI/UX Pro Max & 21.dev Bento",
        "UI/UX & Design Systems",
        "Glassmorphic Bento Grid architecture, mouse-tracking radial spotlight cards, Aurora mesh gradients, and WCAG AAA dark mode.",
        "Apply UI/UX Pro Max design tokens: Obsidian #060913 canvas, backdrop-blur-xl Bento panels with 1px specular borders, cursor-tracking radial spotlight (--mouse-x, --mouse-y), and high-contrast typography.",
        ["21.dev", "Bento Grid", "Glassmorphism", "Dark UI"],
    ),
    (
        "tailwind-shadcn-radix",
        "Tailwind CSS & Shadcn Component System",
        "UI/UX & Design Systems",
        "Composable Radix-style accessible primitives, responsive grid tokens, semantic status badges, and keyboard-first controls.",
        "Structure UI into modular accessible primitives with clear visual hierarchy, focus-visible rings, responsive breakpoints, segmented tab bars, and clean state indicators.",
        ["Tailwind", "shadcn/ui", "Radix", "Responsive"],
    ),
    (
        "21dev-interactive-hero",
        "21st.dev Aurora Hero & Spotlight Portals",
        "UI/UX & Design Systems",
        "Interactive hero sections with animated Aurora mesh beams, glowing border-beam cards, and live interactive preview stages.",
        "Build high-converting interactive hero headers with multi-stop radial Aurora gradients, animated border beams, live interactive sandboxes, and copy-ready code drawers.",
        ["21.dev", "Aurora", "Border Beam", "Portal"],
    ),
    (
        "macos-floating-dock-ui",
        "macOS Floating Dock & Command Palette (⌘K)",
        "UI/UX & Design Systems",
        "Spring-magnified floating action docks, ⌘K spotlight command palettes, and keyboard-shortcut driven navigation.",
        "Include a floating glassmorphic action dock with hover magnification and a keyboard-accessible instant search/command bar for switching views and triggering actions.",
        ["Floating Dock", "Command Palette", "⌘K", "Navigation"],
    ),
    (
        "nav-bar-gallery",
        "Nav-Bar Gallery (Tubelight Command Bar, Top Glass Ribbon & Floating Dock)",
        "UI/UX & Design Systems",
        "Curated gallery of 3 switchable navigation architectures: Hybrid Tubelight Segmented Command Bar + Collapsible Rail, Full-Width Top Glass Ribbon, and Floating macOS Magnetic Dock.",
        "Implement a synchronized multi-mode navigation bar gallery featuring a glowing Tubelight active-tab indicator, breadcrumb context pill, live operational telemetry badges, and an interactive Nav Layout Switcher (Hybrid, Top Ribbon, Floating Dock).",
        ["Nav-Bar Gallery", "Tubelight Nav", "Command Bar", "Navigation"],
    ),
    (
        "aceternity-magic-ui",
        "Aceternity & Magic UI Spotlight Cards",
        "UI/UX & Design Systems",
        "Glowing meteor showers, animated beam connectors, shimmer buttons, and 3D perspective card hover effects.",
        "Incorporate specular border beams, shimmer CTA buttons, subtle background grid beams, and multi-layered 3D perspective hover cards.",
        ["Aceternity", "Magic UI", "Shimmer", "3D Cards"],
    ),
    (
        "figma-tokens-design-system",
        "Design Tokens & Atomic Component System",
        "UI/UX & Design Systems",
        "Strict CSS custom property token scales for spacing, fluid typography, elevation shadows, and semantic color roles.",
        "Define a cohesive `:root` CSS token system (--surface, --border, --accent, --radius, --shadow) and compose reusable atomic UI components.",
        ["Design Tokens", "CSS Variables", "Atomic UI", "Theming"],
    ),
    (
        "bento-grid-dashboard",
        "Asymmetric Bento Grid Executive Layout",
        "UI/UX & Design Systems",
        "Responsive 12-column asymmetric Bento grids with span-4/span-8 cards, live status headers, and collapsible drawers.",
        "Use a 12-column responsive CSS Grid with asymmetric Bento spans, consistent 16px-20px gaps, and self-contained interactive card headers.",
        ["Bento Grid", "CSS Grid", "Dashboard", "Layout"],
    ),
    (
        "neumorphic-spatial-visionos",
        "Spatial Glass & visionOS Depth UI",
        "UI/UX & Design Systems",
        "Frosted spatial glass materials, specular inner highlights, ambient depth shadows, and eye-tracking style hover focus.",
        "Layer frosted translucent surfaces with `inset 0 1px 0 rgba(255,255,255,0.18)`, soft depth shadows, and smooth scale focus states.",
        ["visionOS", "Spatial UI", "Frosted Glass", "Depth"],
    ),
    (
        "swiss-typographic-grid",
        "Swiss International Typographic Hierarchy",
        "UI/UX & Design Systems",
        "Precision modular grid lines, bold display headlines, tabular monospace numerals, and high-signal editorial layout.",
        "Pair bold geometric headings with crisp hairlines, `font-variant-numeric: tabular-nums` metrics, and disciplined negative space.",
        ["Typography", "Swiss Grid", "Editorial", "Tabular Nums"],
    ),
    (
        "micro-interactions-haptics",
        "Tactile Micro-Interactions & State Feedback",
        "UI/UX & Design Systems",
        "Instant button press compression, copy-to-clipboard toast confirmations, ripple feedback, and optimistic state badges.",
        "Every button, tab, and toggle must provide immediate visual feedback on hover, active press, and completion (e.g. ✓ Copied state).",
        ["Micro-Interactions", "UX Feedback", "Toasts", "States"],
    ),
    (
        "adaptive-theming-oklch",
        "OKLCH Perceptual Color & Dynamic Themes",
        "UI/UX & Design Systems",
        "Perceptually uniform color palettes, live accent color switchers, and guaranteed contrast ratios across surfaces.",
        "Provide harmonious primary/secondary/accent color palettes with live theme or accent switching and high-contrast text legibility.",
        ["OKLCH", "Color Theory", "Dynamic Theme", "Contrast"],
    ),
    (
        "command-k-spotlight",
        "Instant Search & Multi-Faceted Filter Bar",
        "UI/UX & Design Systems",
        "Real-time fuzzy search input, category pill filters, live result counts, and zero-state reset actions.",
        "Include an instant search bar paired with category filter pills and live `(filtered / total)` counters for all catalogs and lists.",
        ["Instant Search", "Filtering", "Faceted UI", "UX"],
    ),

    # ==================== 2. Animation, 3D & Shaders (10) ====================
    (
        "framer-motion-physics",
        "Framer Motion & Spring Physics",
        "Animation, 3D & Shaders",
        "Hardware-accelerated 60/120fps spring physics, layoutId shared element transitions, staggered reveals, and gesture feedback.",
        "Use spring physics (stiffness: 320, damping: 28) for layout transitions, hover/tap scale micro-interactions, and staggered list entrances.",
        ["Framer Motion", "Spring Physics", "60FPS", "Gestures"],
    ),
    (
        "html5-canvas-webgl",
        "HTML5 Canvas, SVG & Web Animations API",
        "Animation, 3D & Shaders",
        "Interactive HTML5 <canvas> particle engines, SVG stroke-dasharray path morphing, CSS3 3D perspective, and live sample code tabs.",
        "Build interactive HTML5 visual stages using requestAnimationFrame Canvas 2D rendering, SVG vector stroke animation, and synchronized HTML/CSS/JS sample code inspectors.",
        ["HTML5", "Canvas 2D", "SVG Morph", "WAAPI"],
    ),
    (
        "threejs-webgl-shaders",
        "Three.js, WebGL & Custom GLSL Shaders",
        "Animation, 3D & Shaders",
        "Interactive 3D scenes, procedural particle fields, custom vertex/fragment shader uniforms, and orbital camera controls.",
        "Render hardware-accelerated 3D scenes or procedural WebGL/Canvas shader visuals with interactive pointer tracking and adjustable speed/uniforms.",
        ["Three.js", "WebGL", "GLSL Shaders", "3D"],
    ),
    (
        "gsap-scrolltrigger-choreo",
        "GSAP Timeline & Scroll Choreography",
        "Animation, 3D & Shaders",
        "Multi-stage timeline sequencing, scrubbable playback controls, magnetic cursor attractors, and kinetic typography.",
        "Provide timeline playback controls (0.5x, 1x, 2x speed, replay), choreographed reveals, and magnetic cursor pull effects on interactive elements.",
        ["GSAP", "Timelines", "Kinetic Text", "Choreography"],
    ),
    (
        "react-three-fiber-drei",
        "Interactive 3D Product & Geometry Stage",
        "Animation, 3D & Shaders",
        " wireframe/solid 3D geometry viewers, interactive rotation gizmos, lighting presets, and camera orbit controls.",
        "Include an interactive 3D wireframe or perspective stage with rotation, zoom, speed controls, and live coordinate readouts.",
        ["R3F", "3D Stage", "Perspective", "Interactive"],
    ),
    (
        "lottie-rive-state-machines",
        "State-Driven Vector & Icon Choreography",
        "Animation, 3D & Shaders",
        "Interactive state-machine driven vector animations that respond to hover, click, progress percentage, and validation states.",
        "Create multi-state vector SVG/Canvas animations that transition smoothly between idle, active, loading, and success states.",
        ["Rive", "Lottie", "State Machine", "Vector"],
    ),
    (
        "svg-morph-choreography",
        "SVG Path Morphing & Liquid Blob Filters",
        "Animation, 3D & Shaders",
        "SVG `<feGaussianBlur>` + `<feColorMatrix>` gooey liquid metaballs, path `d` attribute morphing, and animated gradients.",
        "Use SVG filter pipelines and keyframe path morphing to create organic liquid motion and crisp vector telemetry graphics.",
        ["SVG Filters", "Metaballs", "Liquid Motion", "Morph"],
    ),
    (
        "css-scroll-driven-animations",
        "CSS3 3D Transforms & Hardware Keyframes",
        "Animation, 3D & Shaders",
        "Pure GPU-composited `@keyframes` using `transform: perspective() rotate3d()` and `will-change: transform` at 120Hz.",
        "Author hardware-accelerated CSS3 `@keyframes` with `transform-style: preserve-3d`, custom cubic-bezier springs, and zero layout thrashing.",
        ["CSS3 3D", "Keyframes", "120Hz GPU", "Cubic Bezier"],
    ),
    (
        "physics-matterjs-rapier",
        "2D Rigid-Body Gravity & Collision Physics",
        "Animation, 3D & Shaders",
        "Interactive gravity sandboxes, elastic collision restitution, draggable physics bodies, and impulse triggers.",
        "Simulate velocity, gravity, and elastic bounce restitution in interactive Canvas stages with user-triggered impulse controls.",
        ["Physics Engine", "Collisions", "Gravity", "Simulation"],
    ),
    (
        "particle-verlet-simulations",
        "Constellation & Fluid Particle Simulators",
        "Animation, 3D & Shaders",
        "Proximity-linked particle constellations, cursor repulsion/attraction fields, and color-cycled trails.",
        "Implement 60fps `requestAnimationFrame` particle networks with distance-based connecting lines and interactive pointer fields.",
        ["Particles", "Constellation", "Canvas", "Interactive"],
    ),

    # ==================== 3. Frontend & Web Architecture (10) ====================
    (
        "nextjs-15-app-router",
        "Next.js 15 App Router & Modern React",
        "Frontend Architecture",
        "Next.js 15 App Router conventions, client/server component boundaries, streaming suspense states, and route handlers.",
        "Follow Next.js 15 App Router structure with clean 'use client' boundaries, typed props, instant loading states, and modular composition.",
        ["Next.js 15", "App Router", "React 19", "TypeScript"],
    ),
    (
        "react-zustand-tanstack",
        "Zustand Store & Reactive State Machine",
        "Frontend Architecture",
        "Predictable client state stores, derived selectors, undo/redo history stacks, and persistent local state sync.",
        "Manage complex UI state with clean reactive state containers, instant filter/sort selectors, and optimistic UI transitions.",
        ["Zustand", "State Machine", "Reactive UI", "Store"],
    ),
    (
        "realtime-kanbans-collaborative",
        "Interactive Kanban, Drag & Drop & Boards",
        "Frontend Architecture",
        "Multi-column sortable boards, drag-and-drop card reordering, inline editing, priority tags, and live status filters.",
        "Implement interactive multi-column or sortable card layouts with instant status transitions, priority badges, and live counters.",
        ["Kanban", "Drag & Drop", "Boards", "Workflows"],
    ),
    (
        "pwa-offline-indexeddb",
        "Offline-First PWA & LocalStorage Sync",
        "Frontend Architecture",
        "Resilient client-side persistence, export/import JSON state snapshots, keyboard shortcuts, and responsive mobile ergonomics.",
        "Support client-side state persistence, one-click clipboard/JSON export, and responsive mobile/tablet/desktop viewport adaptation.",
        ["PWA", "Offline-First", "LocalStorage", "Responsive"],
    ),
    (
        "vite-ts-monorepo",
        "Vite + TypeScript Modular SPA Architecture",
        "Frontend Architecture",
        "Fast HMR module boundaries, strict TypeScript interfaces, custom hooks, and zero-bundle-bloat utilities.",
        "Organize code into clean typed data structures, pure helper functions, and decoupled view rendering controllers.",
        ["Vite", "TypeScript", "Modular SPA", "Clean Code"],
    ),
    (
        "monaco-code-playground",
        "Live Code Playground & Multi-Tab Inspector",
        "Frontend Architecture",
        "Interactive split-pane code playgrounds with HTML5, CSS3, and JS tabs, syntax formatting, and one-click clipboard copy.",
        "Provide a synchronized multi-tab code inspector (HTML5 Markup, CSS3 Keyframes, JS Controller) that updates live when any item is selected.",
        ["Code Playground", "Live Preview", "Syntax Tabs", "Copy Code"],
    ),
    (
        "rich-text-tiptap-lexical",
        "Block-Based Rich Editor & Markdown Canvas",
        "Frontend Architecture",
        "Slash-command block editors, live Markdown preview, callout blocks, and interactive document outlines.",
        "Support structured block content, formatted code blocks, live preview toggling, and clean document navigation.",
        ["Rich Text", "Markdown", "Block Editor", "Canvas"],
    ),
    (
        "virtualized-infinite-grid",
        "High-Density Virtualized Data Grid",
        "Frontend Architecture",
        "Multi-column sortable tables, pinned headers, column resizing, inline cell badges, and instant row filtering.",
        "Render scannable high-density data grids with sticky headers, column sorting, status pills, and instant row search.",
        ["Data Grid", "Tables", "Sorting", "High Density"],
    ),
    (
        "multi-step-wizard-forms",
        "Multi-Step Validated Wizard & Schema Forms",
        "Frontend Architecture",
        "Stepped progress indicators, real-time field validation, conditional form branches, and live summary previews.",
        "Build clear stepped workflows with progress indicators, instant inline validation feedback, and live configuration previews.",
        ["Wizard", "Forms", "Validation", "Stepped UI"],
    ),
    (
        "i18n-rtl-localization",
        "Multi-Locale i18n & Logical CSS Layouts",
        "Frontend Architecture",
        "Logical CSS properties (`inline-start`, `block-end`), locale switchers, and currency/date formatting.",
        "Use flexible flexbox/grid layouts and locale-aware number/time formatting that adapt cleanly across languages and screen sizes.",
        ["i18n", "Localization", "Logical CSS", "Global Ready"],
    ),

    # ==================== 4. Data Visualization & FinTech (8) ====================
    (
        "d3-recharts-telemetry",
        "D3.js & Real-Time Telemetry Dashboards",
        "Data & Analytics",
        "Interactive SVG/Canvas sparklines, radial gauges, time-series telemetry charts, KPI bento cards, and anomaly alerts.",
        "Render live SVG/Canvas charts, animated KPI metric counters, sparkline trends, and interactive time-range filters.",
        ["D3.js", "Charts", "Telemetry", "Analytics"],
    ),
    (
        "financial-quant-terminal",
        "Quant Orderbook & Live Ticker Terminal",
        "Data & Analytics",
        "High-frequency streaming data tables, heatmap matrices, delta badges, and multi-pane financial/ops terminal layouts.",
        "Design dense, high-signal institutional terminal interfaces with tabular-nums alignment, delta pills, and live tick simulation.",
        ["Quant", "Terminal UI", "Heatmaps", "Live Tickers"],
    ),
    (
        "webgl-deckgl-geospatial",
        "Geospatial Map & Fleet Telemetry Radar",
        "Data & Analytics",
        "Interactive coordinate radars, node topology maps, animated route arcs, and region telemetry breakdowns.",
        "Include interactive radar/map stages with pulsing node markers, coordinate readouts, and regional metric cards.",
        ["Geospatial", "Radar", "Topology", "Telemetry"],
    ),
    (
        "network-graph-cytoscape",
        "Force-Directed Knowledge & Dependency Graph",
        "Data & Analytics",
        "Interactive node-link graphs, cluster highlighting, shortest-path tracing, and node inspector drawers.",
        "Render interactive connected node graphs where selecting a node highlights its edges and displays detailed metadata.",
        ["Knowledge Graph", "Force Graph", "Nodes", "Visualization"],
    ),
    (
        "bi-pivot-olap-explorer",
        "Executive BI KPI & Cohort Explorer",
        "Data & Analytics",
        "Cohort retention matrices, funnel conversion stages, revenue breakdown bars, and CSV/JSON export.",
        "Present executive KPI summary cards alongside interactive cohort/funnel visualizations and filterable metric breakdowns.",
        ["BI", "Cohorts", "Funnels", "Executive KPI"],
    ),
    (
        "streaming-candlestick-charts",
        "OHLC Candlestick & Depth Chart Engine",
        "Data & Analytics",
        "Interactive crosshair tooltips, volume histograms, moving average overlays, and timeframe selectors (1m, 15m, 1D).",
        "Provide timeframe toggle buttons, interactive chart stages with crosshair readouts, and real-time price/volume metrics.",
        ["Candlestick", "Trading UI", "Timeframes", "Charts"],
    ),
    (
        "real-time-log-observability",
        "Distributed Trace & Log Stream Inspector",
        "Data & Analytics",
        "Severity-colored log streams (INFO, WARN, ERROR), latency flamegraphs, P99 histograms, and regex filtering.",
        "Include a live filterable log/event console with severity badges, timestamp alignment, and latency metrics.",
        ["Observability", "Logs", "Traces", "APM"],
    ),
    (
        "interactive-sql-notebook",
        "Interactive Query & Data Notebook UI",
        "Data & Analytics",
        "Executable query cells, schema tree browsers, result table/chart switchers, and query execution timing.",
        "Combine a query/filter editor with an instant result table and visual chart toggle.",
        ["Notebook", "SQL UI", "Data Explorer", "Schema"],
    ),

    # ==================== 5. Backend, APIs & Distributed Systems (10) ====================
    (
        "fullstack-api-architect",
        "Full-Stack REST, GraphQL & WebSockets",
        "Backend & APIs",
        "Typed REST & WebSocket integration, optimistic state updates, search/filter pipelines, and resilient error boundaries.",
        "Include interactive client-side state controllers, instant search/filtering, structured data models, and clean async handlers.",
        ["REST", "WebSockets", "Full-Stack", "TypeScript"],
    ),
    (
        "fastapi-async-microservices",
        "FastAPI Async & Event-Driven Architecture",
        "Backend & APIs",
        "Structured Pydantic schemas, async background workers, SSE/WebSocket event streams, and health/metrics endpoints.",
        "Model clear request/response schemas, real-time event logs, status health indicators, and structured API inspector panels.",
        ["FastAPI", "AsyncIO", "Pydantic", "Microservices"],
    ),
    (
        "graphql-apollo-federation",
        "GraphQL Schema & Query Playground",
        "Backend & APIs",
        "Typed GraphQL queries/mutations, fragment composition, schema introspection viewers, and optimistic cache updates.",
        "Provide structured query/response inspectors and normalized entity state management.",
        ["GraphQL", "Schema", "Introspection", "API"],
    ),
    (
        "webrtc-livekit-media",
        "WebRTC Low-Latency Audio/Video & Rooms",
        "Backend & APIs",
        "Real-time media room stages, audio spectrum visualizers, participant tiles, and connection quality telemetry.",
        "Include live audio/waveform visualizers, room status controls, and latency/bitrate telemetry badges.",
        ["WebRTC", "LiveKit", "Audio/Video", "Real-Time"],
    ),
    (
        "websocket-crdt-collab",
        "Multiplayer CRDT & Live Presence Sync",
        "Backend & APIs",
        "Live collaborator cursors, presence avatars, conflict-free shared state updates, and activity feed streams.",
        "Display active session indicators, live event activity logs, and synchronized multi-view state.",
        ["CRDT", "WebSockets", "Multiplayer", "Presence"],
    ),
    (
        "redis-bullmq-job-queues",
        "Async Task Queues & Worker Pipeline UI",
        "Backend & APIs",
        "Job state progressions (Queued, Active, Completed, Failed), retry backoff controls, and throughput gauges.",
        "Visualize stepped task progress with status icons, iteration counters, and retry/replay actions.",
        ["Job Queues", "Workers", "Pipelines", "Async"],
    ),
    (
        "kafka-event-sourcing",
        "Event Sourcing & CQRS Stream Broker",
        "Backend & APIs",
        "Immutable event ledgers, topic partition monitors, consumer lag gauges, and event replay timelines.",
        "Provide an ordered event stream history with replay capabilities and state projection views.",
        ["Event Sourcing", "CQRS", "Streams", "Replay"],
    ),
    (
        "webhook-idempotency-engine",
        "Webhook Delivery & Signature Inspector",
        "Backend & APIs",
        "HMAC signature verification badges, payload JSON diffs, delivery status codes, and one-click redelivery.",
        "Show structured JSON payload inspectors, HTTP status badges (200 OK, 422, 500), and replay buttons.",
        ["Webhooks", "Idempotency", "JSON Inspector", "API"],
    ),
    (
        "rate-limiting-circuit-breaker",
        "Token Bucket Rate Limiter & Circuit Breaker",
        "Backend & APIs",
        "Quota consumption meters, circuit breaker state machines (Closed, Open, Half-Open), and fallback responses.",
        "Include resource governance gauges, quota progress bars, and resilient fallback handling.",
        ["Rate Limiting", "Circuit Breaker", "Resilience", "Governance"],
    ),
    (
        "grpc-protobuf-streams",
        "gRPC Bi-Directional Stream & Service Mesh",
        "Backend & APIs",
        "Service-to-service topology cards, RPC latency histograms, and typed contract inspectors.",
        "Display clear service health cards, RPC method catalogs, and sample request/response code snippets.",
        ["gRPC", "Protobuf", "Service Mesh", "RPC"],
    ),

    # ==================== 6. Database, Vector & Storage (8) ====================
    (
        "prisma-postgres-vector",
        "PostgreSQL, Prisma ORM & pgvector Search",
        "Database & Storage",
        "Normalized entity schemas, semantic + keyword hybrid search filtering, pagination, and relational data inspectors.",
        "Provide rich datasets with multi-faceted filtering (search query + category + status), relational tags, and detail inspection.",
        ["PostgreSQL", "Prisma", "pgvector", "Hybrid Search"],
    ),
    (
        "supabase-rls-realtime",
        "Supabase Realtime & Row-Level Security",
        "Database & Storage",
        "Live table subscriptions, RLS policy matrices, auth session simulation, and instant CRUD mutations.",
        "Support interactive create/read/update/delete state operations with immediate UI reflection and policy badges.",
        ["Supabase", "RLS", "Realtime DB", "CRUD"],
    ),
    (
        "drizzle-sqlite-turso",
        "Edge SQLite & Drizzle Type-Safe Queries",
        "Database & Storage",
        "Zero-latency edge read replicas, schema migration previews, and SQL query builders.",
        "Show clean schema definitions alongside fast local filtering and index lookups.",
        ["SQLite", "Drizzle ORM", "Edge DB", "Type-Safe"],
    ),
    (
        "mongodb-aggregation-pipelines",
        "Document Store & Aggregation Pipeline Builder",
        "Database & Storage",
        "Multi-stage `$match`, `$group`, `$project` pipeline visualizers and nested JSON document explorers.",
        "Allow filtering and grouping items by category/tag with live aggregated counts.",
        ["MongoDB", "JSON Documents", "Aggregation", "NoSQL"],
    ),
    (
        "elasticsearch-bm25-hybrid",
        "Full-Text BM25 & Faceted Search Engine",
        "Database & Storage",
        "Highlighted search matches, faceted category counts, synonym expansion, and relevance scoring.",
        "Provide instant substring/keyword matching across titles, categories, and descriptions with live match counts.",
        ["Search Engine", "BM25", "Facets", "Highlighting"],
    ),
    (
        "duckdb-wasm-in-browser",
        "In-Browser Analytical OLAP Engine",
        "Database & Storage",
        "Client-side analytical aggregations, instant group-by breakdowns, and zero-server-roundtrip filtering.",
        "Compute live summary statistics and category distributions directly in the client.",
        ["DuckDB", "OLAP", "Client Analytics", "Fast"],
    ),
    (
        "timeseries-influx-timescale",
        "Time-Series Metrics & Downsampling Store",
        "Database & Storage",
        "High-cardinality metric buckets, rolling window averages, and retention policy controls.",
        "Display time-bucketed telemetry series with adjustable playback or window speeds.",
        ["Time-Series", "Metrics", "Telemetry", "Rollups"],
    ),
    (
        "s3-multipart-media-pipeline",
        "Asset Vault & Media Metadata Inspector",
        "Database & Storage",
        "Grid/list asset browsers, MIME-type badges, file size formatters, and instant preview drawers.",
        "Organize items with clear metadata badges (type, performance rating, size) and instant preview stages.",
        ["Asset Vault", "Media Pipeline", "Metadata", "Preview"],
    ),

    # ==================== 7. AI, LLMs & Autonomous Agents (10) ====================
    (
        "local-llm-rag-agent",
        "Local LLM (Ollama), RAG & Agentic Workflows",
        "AI & Agents",
        "Autonomous multi-step agent loops, prompt chain inspectors, token streaming UI, and context-window citation viewers.",
        "Include interactive agent step timelines, prompt/response playgrounds, context inspection tabs, and live execution indicators.",
        ["Ollama", "Local LLM", "RAG", "Agentic UI"],
    ),
    (
        "mcp-composio-integrations",
        "MCP Servers & Composio Tool Calling",
        "AI & Agents",
        "Model Context Protocol (MCP) tool registries, SaaS webhook connectors (GitHub, Slack, Linear, Notion), and schema validators.",
        "Structure tool-calling interfaces with clear JSON parameter schemas, connection status badges, and execution logs.",
        ["MCP", "Composio", "Tool Calling", "Integrations"],
    ),
    (
        "generative-ui-widgets",
        "Generative UI & Interactive Inline Widgets",
        "AI & Agents",
        "Dynamic interactive widgets, live parameter sliders, code-to-preview split views, and educational visual walkthroughs.",
        "Pair every concept or component with an interactive live stage, real-time parameter controls, and a synchronized multi-tab code viewer.",
        ["Generative UI", "Interactive Widgets", "Live Stage", "Code"],
    ),
    (
        "langgraph-multi-agent",
        "Multi-Agent Orchestration & DAG Supervisor",
        "AI & Agents",
        "Supervisor-worker agent graphs, handoff state inspection, parallel subagent dispatch, and consensus synthesis.",
        "Visualize multi-step agent workflows with clear node states, handoff logs, and artifact outputs.",
        ["Multi-Agent", "LangGraph", "Orchestration", "DAG"],
    ),
    (
        "semantic-chunking-reranker",
        "RAG Vector Retrieval & Citation Reranker",
        "AI & Agents",
        "Cosine similarity score bars, chunk overlap visualizers, source file links, and grounded synthesis.",
        "Display source context references, similarity confidence badges, and expandable code/text snippets.",
        ["RAG", "Reranker", "Embeddings", "Citations"],
    ),
    (
        "structured-json-schema-llm",
        "Constrained JSON Schema & AST Code Synthesis",
        "AI & Agents",
        "Grammar-constrained LLM outputs, deterministic AST/patch parsing, and zero-hallucination schema validation.",
        "Produce valid, self-contained HTML5/React code blocks and structured JSON catalogs with zero syntax errors.",
        ["JSON Schema", "AST Synthesis", "Structured Output", "LLM"],
    ),
    (
        "voice-stt-tts-realtime",
        "Real-Time Voice HUD & Audio Waveform Agent",
        "AI & Agents",
        " Ambient voice HUDs, frequency bar visualizers, push-to-talk states, and live transcript streams.",
        "Include animated audio frequency bars, voice state indicators (Listening, Thinking, Speaking), and transcript cards.",
        ["Voice AI", "Waveform", "STT/TTS", "Ambient HUD"],
    ),
    (
        "browser-use-dom-agent",
        "Autonomous DOM Inspector & Browser Agent",
        "AI & Agents",
        "Live viewport bounding-box overlays, action trace logs (Click, Type, Scroll), and DOM selector inspectors.",
        "Provide a live interactive viewport paired with an action trace log and element/code inspector.",
        ["Browser Agent", "DOM Inspector", "Automation", "Viewport"],
    ),
    (
        "code-interpreter-sandbox",
        "Isolated Code Execution & Diff Patch Engine",
        "AI & Agents",
        "Side-by-side unified diff viewers, atomic file backup/rollback, and sandboxed build verification loops.",
        "Show clear code diffs, file badges, and verified build status indicators.",
        ["Sandbox", "Diff Engine", "Code Execution", "Self-Healing"],
    ),
    (
        "prompt-eval-guardrails",
        "LLM Eval Benchmarks & Safety Guardrails",
        "AI & Agents",
        "Prompt version A/B comparisons, latency/token cost metrics, and deterministic assertion gates.",
        "Display clear performance metrics (FPS, latency, iteration count) and verification badges.",
        ["LLM Evals", "Guardrails", "Benchmarks", "Telemetry"],
    ),

    # ==================== 8. Security, Auth & Compliance (8) ====================
    (
        "oauth-jwt-zero-trust",
        "Zero-Trust Auth, RBAC & Security Controls",
        "Security & Quality",
        "Role-Based Access Control (RBAC) matrices, API key vaults, audit log streams, and XSS/CSP-safe rendering.",
        "Ensure safe DOM updates, sanitized user inputs, role/permission status indicators, and clear security audit feedback.",
        ["RBAC", "Zero Trust", "Security", "Audit Logs"],
    ),
    (
        "webauthn-passkeys-fido2",
        "Passkeys (WebAuthn) & Biometric Auth Flow",
        "Security & Quality",
        "Passwordless FIDO2 challenge-response flows, hardware key badges, and session device managers.",
        "Provide clean authentication/verification status badges and session governance controls.",
        ["Passkeys", "WebAuthn", "FIDO2", "Auth"],
    ),
    (
        "csp-xss-csrf-hardening",
        "DOM Sanitization & XSS/CSP Hardening",
        "Security & Quality",
        "Strict HTML entity escaping, safe `textContent` code rendering, and zero unsafe eval execution.",
        "Always render sample code using `textContent` or properly escaped entities so raw `<script>` or HTML tags never break the page.",
        ["XSS Prevention", "CSP", "Sanitization", "AppSec"],
    ),
    (
        "e2ee-webcrypto-vault",
        "WebCrypto AES-GCM & Secret Env Governance",
        "Security & Quality",
        "Client-side key derivation, masked secret environment variable editors, and rotation timestamps.",
        "Include masked/unmasked secret toggles and clean environment variable configuration panels.",
        ["WebCrypto", "Secrets Vault", "Env Governance", "Encryption"],
    ),
    (
        "accessibility-perf-audit",
        "WCAG AAA & Core Web Vitals Optimization",
        "Security & Quality",
        "High-contrast AAA readability, semantic HTML5 landmarks, keyboard navigation, and zero cumulative layout shift (CLS).",
        "Ensure semantic HTML5 landmarks (<header>, <main>, <aside>, <section>), ARIA attributes, and 7:1 contrast on primary text.",
        ["WCAG AAA", "A11y", "Core Web Vitals", "Semantic HTML"],
    ),
    (
        "test-driven-self-healing",
        "Self-Healing & Defensive Build Verification",
        "Security & Quality",
        "Zero-runtime-error defensive guards, null-safe DOM bindings, self-contained dependencies, and automated build verification.",
        "Write defensive, self-contained code with null-safe DOM queries and zero broken imports so `npm run build` succeeds on first pass.",
        ["Self-Healing", "Zero Errors", "Verification", "TDD"],
    ),
    (
        "playwright-e2e-visual-regression",
        "Deterministic E2E & Visual State Assertions",
        "Security & Quality",
        "Predictable data-testid selectors, deterministic initial render states, and responsive viewport resilience.",
        "Ensure the application initializes into a populated, interactive default state immediately on load without requiring manual setup.",
        ["E2E Ready", "Visual Polish", "Deterministic", "QA"],
    ),
    (
        "core-web-vitals-lighthouse",
        "100/100 Lighthouse Performance & Zero-CLS",
        "Security & Quality",
        "Explicit container dimensions, GPU-composited animations, and zero external blocking network requests.",
        "Reserve explicit dimensions for all interactive stages and canvases to guarantee 0.00 Cumulative Layout Shift (CLS).",
        ["Lighthouse 100", "Zero CLS", "60FPS", "Performance"],
    ),

    # ==================== 9. Cloud, Docker & DevOps (8) ====================
    (
        "docker-sandbox-governance",
        "Docker Container & Resource Governance",
        "Cloud & DevOps",
        "Container CPU/Memory cgroup telemetry gauges, port mapping inspectors, environment injection, and one-click container restart.",
        "Surface clear container health indicators, memory/CPU utilization bars, and runtime environment controls.",
        ["Docker", "Containers", "Cgroups", "Governance"],
    ),
    (
        "kubernetes-helm-gitops",
        "Kubernetes Pod Topology & GitOps Rollouts",
        "Cloud & DevOps",
        "ReplicaSet health grids, canary traffic split sliders, and live pod log streaming.",
        "Visualize cluster/service nodes with live status badges (Healthy, Scaling, Degraded) and resource metrics.",
        ["Kubernetes", "GitOps", "Topology", "Cloud Native"],
    ),
    (
        "github-actions-ci-cd",
        "CI/CD Pipeline DAG & Build Gate Matrix",
        "Cloud & DevOps",
        "Multi-stage pipeline graphs (Lint -> Test -> Build -> Preview), duration timers, and artifact download links.",
        "Show stepped build/verification progress with duration readouts and pass/fail badges.",
        ["CI/CD", "Pipelines", "Build Gates", "Automation"],
    ),
    (
        "git-worktree-version-control",
        "Git Branch, Diff & Archive Export Engine",
        "Cloud & DevOps",
        "One-click Git init/commit/branch workflows, unified diff inspection, remote push, and ZIP archive export.",
        "Keep workspace files cleanly structured and ready for Git commit or ZIP archive export.",
        ["Git", "Version Control", "Diffs", "Export"],
    ),
    (
        "opentelemetry-prometheus-grafana",
        "OpenTelemetry Metrics & Alerting Rules",
        "Cloud & DevOps",
        "RED metrics (Rate, Errors, Duration), threshold alert banners, and service dependency health.",
        "Display real-time rate/latency/FPS badges and clear status indicators.",
        ["OpenTelemetry", "Prometheus", "Metrics", "Monitoring"],
    ),
    (
        "edge-cloudflare-workers",
        "Zero-Cold-Start Edge Compute & Caching",
        "Cloud & DevOps",
        "Sub-millisecond local/edge response patterns, stale-while-revalidate caching, and lightweight self-contained bundles.",
        "Deliver self-contained, fast-loading HTML5/JS bundles with zero external CDN failures.",
        ["Edge Compute", "Zero Cold Start", "Fast Load", "Self-Contained"],
    ),
    (
        "terraform-iac-blueprints",
        "Infrastructure-as-Code Blueprint Designer",
        "Cloud & DevOps",
        "Visual cloud resource graphs, cost estimation tables, and exportable configuration code tabs.",
        "Pair visual architecture cards with copyable configuration/code snippets.",
        ["IaC", "Blueprints", "Architecture", "Code Export"],
    ),
    (
        "chaos-resilience-engineering",
        "Fault Injection & Self-Healing Recovery",
        "Cloud & DevOps",
        "Graceful degradation under network/process failures, automatic fallback synthesis, and instant state recovery.",
        "Include graceful fallback handlers so every interactive control works reliably offline or in air-gapped sandboxes.",
        ["Resilience", "Self-Healing", "Air-Gapped", "Fault Tolerant"],
    ),

    # ==================== 10. SaaS, Commerce & Industry Verticals (8) ====================
    (
        "stripe-billing-saas",
        "SaaS Pricing, Usage Metering & Checkout",
        "SaaS & Verticals",
        "Interactive billing tier toggles (Monthly/Annual), usage quota progress bars, feature comparison matrices, and upgrade flows.",
        "Build interactive tier selectors, usage quota gauges, and clear feature comparison cards with instant recalculation.",
        ["SaaS", "Stripe", "Pricing UI", "Metering"],
    ),
    (
        "headless-commerce-cart",
        "Headless E-Commerce Catalog & Slide-Over Cart",
        "SaaS & Verticals",
        "Category/price filtering, instant product quick-view stages, variant selectors, and reactive cart totals.",
        "Provide a filterable item catalog with instant detail preview and interactive state selection.",
        ["E-Commerce", "Catalog", "Interactive Cart", "Filtering"],
    ),
    (
        "multi-tenant-b2b-workspaces",
        "Multi-Tenant Workspace Switcher & Isolation",
        "SaaS & Verticals",
        "Instant workspace switching, per-workspace isolated state/files, and project template locking.",
        "Support clean per-workspace state isolation and clear workspace metadata headers.",
        ["Multi-Tenant", "Workspaces", "B2B SaaS", "Isolation"],
    ),
    (
        "crm-pipeline-automation",
        "CRM Deal Pipeline & Activity Timeline",
        "SaaS & Verticals",
        "Stage conversion funnels, contact activity streams, deal value summaries, and quick-action drawers.",
        "Combine a filterable list/pipeline on the left with a rich detail and activity inspector on the right.",
        ["CRM", "Pipelines", "Activity Stream", "B2B"],
    ),
    (
        "healthtech-fhir-portal",
        "Clinical Vitals Telemetry & Patient Portal",
        "SaaS & Verticals",
        "Real-time ECG/vitals waveform stages, lab reference range bars, and appointment timelines.",
        "Render high-clarity telemetry waveforms, status badges, and structured detail cards.",
        ["HealthTech", "Vitals Waveform", "Portal", "Telemetry"],
    ),
    (
        "edtech-interactive-lms",
        "Interactive Coding & Visual Learning Portal",
        "SaaS & Verticals",
        "Concept catalog sidebar, live interactive visual stage, playback speed controls, and copyable sample code tabs.",
        "Provide a selectable curriculum/type catalog on the left, a live interactive demonstration stage in the center, and sample code tabs below.",
        ["EdTech", "Interactive Portal", "Live Demo", "Sample Code"],
    ),
    (
        "booking-calendar-scheduler",
        "Interactive Time-Slot Matrix & Scheduler",
        "SaaS & Verticals",
        "Day/week slot grids, timezone converters, conflict detection badges, and instant booking confirmation.",
        "Build interactive selection matrices with clear active/selected states and instant confirmation banners.",
        ["Scheduler", "Calendar UI", "Time Slots", "Interactive"],
    ),
    (
        "ai-copilot-docs-wiki",
        "Interactive Developer Docs & API Reference",
        "SaaS & Verticals",
        "Searchable sidebar navigation, live interactive component previews, and multi-language code tabs (HTML5, CSS3, JS).",
        "Pair every selected item with a live interactive stage and copyable HTML5, CSS3, and JS sample code.",
        ["DevDocs", "API Reference", "Live Sandbox", "Code Tabs"],
    ),
    # =========================================================================
    # 9. QWEN 2.5 CODER & LOCAL LLM (8 Skills)
    # =========================================================================
    (
        "qwen25-coder-7b-mastery",
        "Qwen 2.5 Coder 7B Architecture Synthesis",
        "Qwen 2.5 Coder & Local LLM",
        "Optimized zero-boilerplate full-stack HTML5/Tailwind/JS code generation tailored for Qwen2.5-Coder-7B-Instruct.",
        "Synthesize self-contained, high-density interactive HTML5 apps with zero placeholder stubs, clean DOM event delegation, and full state reactivity.",
        ["Qwen2.5-Coder", "7B-Instruct", "Code Synthesis", "Full-Stack"],
    ),
    (
        "qwen-csv-excel-analytics-engine",
        "Qwen Tabular CSV/Excel & FileReader Parser",
        "Qwen 2.5 Coder & Local LLM",
        "Client-side FileReader CSV/TSV/JSON ingestion, automatic numeric column detection, and dynamic KPI aggregation.",
        "Wire an `<input type=\"file\" accept=\".csv,.tsv,.json\">` using `FileReader` to parse rows, recompute KPI cards, and refresh Chart.js and table views.",
        ["Qwen2.5-Coder", "CSV Parser", "FileReader", "Data Analytics"],
    ),
    (
        "qwen-reactive-tailwind-chartjs",
        "Qwen Reactive Tailwind + Chart.js Canvas Studio",
        "Qwen 2.5 Coder & Local LLM",
        "Synchronized Chart.js 4 canvas visualizations (bar, line, doughnut, radar) with live dataset switching and KPI cards.",
        "Maintain a global Chart.js instance (`window.mainChartInstance`), destroy before re-creating on filter/upload, and keep KPIs and tables in sync.",
        ["Qwen2.5-Coder", "Chart.js", "Tailwind CSS", "Reactive UI"],
    ),
    (
        "qwen-multi-turn-context-evolver",
        "Qwen Multi-Turn AST & DOM Context Evolution",
        "Qwen 2.5 Coder & Local LLM",
        "Preserves existing workspace features, state models, and custom UI controls across iterative follow-up prompts.",
        "When evolving existing workspace HTML, preserve all prior working features and data structures while integrating newly requested controls seamlessly.",
        ["Qwen2.5-Coder", "Multi-Turn", "Context Retention", "Iterative Build"],
    ),
    (
        "qwen-self-healing-compiler-loop",
        "Qwen Autonomous Self-Healing & Syntax Verifier",
        "Qwen 2.5 Coder & Local LLM",
        "Closed-loop static and runtime verification that guarantees balanced tags, valid ES2022 syntax, and HTTP 200 readiness.",
        "Ensure all `<script>`, `<style>`, and HTML tags are strictly balanced and all DOM selectors are null-checked before binding event listeners.",
        ["Qwen2.5-Coder", "Self-Healing", "AST Verification", "Zero-Error"],
    ),
    (
        "qwen-local-gguf-kv-cache",
        "Qwen GGUF Q4_K_M KV-Cache & Prompt Optimizer",
        "Qwen 2.5 Coder & Local LLM",
        "Compact token-efficient code generation optimized for llama.cpp GGUF Q4_K_M quantization and prefix KV-cache reuse.",
        "Emit clean, compact, high-signal code without redundant comments or dead CSS so complex apps fit well within a single fast generation pass.",
        ["Qwen2.5-Coder", "GGUF", "llama.cpp", "KV-Cache"],
    ),
    (
        "qwen-interactive-simulation-canvas",
        "Qwen Interactive HTML5 Canvas & Physics Sandbox",
        "Qwen 2.5 Coder & Local LLM",
        "60FPS requestAnimationFrame simulations, interactive parameter sliders, live telemetry readouts, and exportable code.",
        "Use `requestAnimationFrame` with interactive range sliders, pause/reset triggers, and real-time FPS/metric telemetry badges.",
        ["Qwen2.5-Coder", "HTML5 Canvas", "Simulation", "60FPS"],
    ),
    (
        "qwen-enterprise-crud-state-machine",
        "Qwen Client-Side CRUD, Search & LocalStorage State",
        "Qwen 2.5 Coder & Local LLM",
        "Complete create/read/update/delete workflows with instant search filtering, modal forms, status pills, and JSON/CSV export.",
        "Provide a reactive `appData` array with add/delete/filter controls, instant search input, status badges, and one-click CSV/JSON export.",
        ["Qwen2.5-Coder", "CRUD", "State Machine", "Enterprise UI"],
    ),
    # =========================================================================
    # 10. AWS CLOUD & ARCHITECTURE (5 Skills)
    # =========================================================================
    (
        "aws-cloud-architect",
        "AWS Well-Architected Cloud & Serverless Blueprint",
        "AWS Cloud & Architecture",
        "Multi-AZ AWS VPC topology, ALB, ECS Fargate/EKS, Lambda, API Gateway, DynamoDB, Aurora Serverless v2, S3 + CloudFront, and IAM least-privilege.",
        "Design and render AWS Well-Architected multi-AZ cloud topologies with region selectors (us-east-1, us-west-2, eu-central-1), interactive service health tables, ARN copy actions, and synchronized AWS CDK / Terraform / IAM JSON code tabs.",
        ["AWS", "Well-Architected", "VPC", "ECS Fargate", "CloudFront"],
    ),
    (
        "aws-serverless-event-driven",
        "AWS Lambda, API Gateway, DynamoDB & EventBridge",
        "AWS Cloud & Architecture",
        "Event-driven serverless microservices with Lambda (Graviton arm64), API Gateway HTTP/WebSocket APIs, DynamoDB single-table PK/SK design, SQS DLQs, and Step Functions.",
        "Model serverless event pipelines with Lambda handler snippets, DynamoDB single-table PK/SK access patterns, Step Functions state machines, and real-time invocation/latency metrics.",
        ["AWS Lambda", "DynamoDB", "EventBridge", "Step Functions", "Serverless"],
    ),
    (
        "aws-cdk-terraform-iac",
        "AWS CDK v2 (TypeScript) & Terraform IaC Synthesizer",
        "AWS Cloud & Architecture",
        "Production-ready AWS CDK v2 L2/L3 constructs, Terraform aws provider modules, CloudFormation templates, and least-privilege IAM policy JSON documents.",
        "Provide copy-ready multi-tab Infrastructure-as-Code inspectors featuring AWS CDK v2 TypeScript stacks, Terraform main.tf resources, and scoped IAM policy JSON for every architecture component.",
        ["AWS CDK", "Terraform", "CloudFormation", "IAM Policy", "IaC"],
    ),
    (
        "aws-bedrock-genai-agents",
        "Amazon Bedrock Agents, RAG Knowledge Bases & Guardrails",
        "AWS Cloud & Architecture",
        "Serverless GenAI workflows using Amazon Bedrock (Claude/Titan/Llama), OpenSearch Serverless vector stores, Bedrock Guardrails, and Lambda action groups.",
        "Include interactive Amazon Bedrock model playgrounds, RAG citation inspectors, token/latency telemetry, and Boto3 / TypeScript SDK Converse API sample code.",
        ["Amazon Bedrock", "GenAI", "OpenSearch", "RAG", "Boto3"],
    ),
    (
        "aws-finops-cloudwatch-telemetry",
        "AWS FinOps Cost Explorer & CloudWatch Observability",
        "AWS Cloud & Architecture",
        "AWS service cost breakdowns, Graviton/Savings Plans right-sizing estimators, CloudWatch RED metrics (Invocations, Errors, P99 Duration), and X-Ray trace maps.",
        "Build interactive AWS FinOps and CloudWatch observability dashboards with region/service filters, monthly spend charts, Savings Plan calculators, and live CloudWatch alarm badges.",
        ["AWS FinOps", "CloudWatch", "Cost Explorer", "X-Ray", "Observability"],
    ),
    # =========================================================================
    # 11. TOKLESS TOKEN OPTIMIZATION & COMPRESSION (4 Skills)
    # =========================================================================
    (
        "tokless",
        "Tokless: High-Density Token & Context Optimizer",
        "Tokless & Token Optimization",
        "Reduces prompt and completion token usage by 40-70% via AST/symbol context pruning, zero-comment code synthesis, runtime-shim stripping, and data-driven UI loop rendering.",
        "Emit zero code comments, render repeated UI elements from compact JS arrays via .map().join(''), reuse Tailwind utility strings, and strip redundant boilerplate to maximize features per token.",
        ["Tokless", "Token Optimization", "Context Pruning", "High Density"],
    ),
    (
        "tokless-ast-context-pruner",
        "Tokless AST & Runtime-Shim Context Pruner",
        "Tokless & Token Optimization",
        "Automatically strips injected runtime shims, HTML/CSS comments, SVG path blobs, and whitespace from workspace files before LLM prompt assembly.",
        "Keep workspace context payloads compact by referencing only active DOM IDs, state arrays, and event handlers without repeating static boilerplate.",
        ["Tokless", "AST Pruning", "Prompt Compression", "Low Latency"],
    ),
    (
        "tokless-kv-cache-aligner",
        "Tokless Prefix KV-Cache & Prompt Budget Aligner",
        "Tokless & Token Optimization",
        "Aligns static system directives at the prompt prefix for 0ms KV-cache hits in Ollama and llama.cpp while bounding max_tokens to prevent runaway generation.",
        "Maintain deterministic prefix structure and emit concise, complete single-pass HTML5/JS output that fits well within the token budget.",
        ["Tokless", "KV-Cache", "Ollama", "llama.cpp"],
    ),
    (
        "tokless-data-driven-ui-loop",
        "Tokless Data-Driven Array & Loop UI Synthesizer",
        "Tokless & Token Optimization",
        "Replaces repetitive hardcoded HTML cards, rows, and modals with compact JSON state arrays and template literal render loops (saving ~65% output tokens).",
        "Never duplicate 4+ similar HTML blocks; store records in a compact JS array and render dynamically with `.map(...)`.",
        ["Tokless", "DRY Code", "Zero Boilerplate", "Fast Synthesis"],
    ),

    # ==================== 12. TasteSkill & Anti-Slop Art Direction (5) ====================
    (
        "taste-skill",
        "TasteSkill V2 — Anti-Slop Frontend Art Direction",
        "TasteSkill & Anti-Slop Art Direction",
        "TasteSkill V2 (design-taste-frontend) anti-slop UI framework enforcing Brief Inference, 3-Dial Configuration (DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY), Swiss/Editorial typography, and tabular numerals.",
        "Infer domain archetype and 1-line Design Read; configure DESIGN_VARIANCE (1-10), MOTION_INTENSITY (1-10), and VISUAL_DENSITY (1-10); apply Plus Jakarta Sans / Space Grotesk (-0.025em tracking) + JetBrains Mono (tabular-nums), 1px specular hairline borders, and ban generic centered-hero AI slop.",
        ["TasteSkill", "design-taste-frontend", "Anti-Slop", "3-Dial UI"],
    ),
    (
        "taste-minimalist-ui",
        "TasteSkill Minimalist — Warm Monochrome & Editorial Grid",
        "TasteSkill & Anti-Slop Art Direction",
        "Minimalist sub-skill (minimalist-skill) focused on disciplined negative space, architectural 1px hairlines, editorial typography, and restrained monochrome contrast (DV=6, MI=3, VD=3).",
        "Apply TasteSkill Minimalist dials (DESIGN_VARIANCE=6, MOTION_INTENSITY=3, VISUAL_DENSITY=3): use high-contrast monochrome surfaces, crisp 1px structural dividers, generous breathing room, and zero decorative gradient bloat.",
        ["TasteSkill", "minimalist-skill", "Editorial", "Monochrome"],
    ),
    (
        "taste-soft-luxury",
        "TasteSkill Soft — High-Craft Calm & Spring Choreography",
        "TasteSkill & Anti-Slop Art Direction",
        "Soft luxury sub-skill (soft-skill) prioritizing calm, tactile surfaces, diffused ambient lighting, refined font pairings, and natural spring motion (DV=5, MI=6, VD=3).",
        "Apply TasteSkill Soft dials (DESIGN_VARIANCE=5, MOTION_INTENSITY=6, VISUAL_DENSITY=3): use diffused surface elevation, soft specular borders, spacious card padding (24px), and smooth cubic-bezier(0.22, 1, 0.36, 1) spring transitions.",
        ["TasteSkill", "soft-skill", "High-Craft", "Spring UI"],
    ),
    (
        "taste-gpt-strict",
        "TasteSkill Strict AIDA — High-Variance Anti-Slop Engine",
        "TasteSkill & Anti-Slop Art Direction",
        "Strict variant (gpt-tasteskill) featuring high layout variance (DV=8, MI=7, VD=5), asymmetric 12-column Bento spans, and aggressive elimination of generic AI card grids.",
        "Apply TasteSkill Strict dials (DESIGN_VARIANCE=8, MOTION_INTENSITY=7, VISUAL_DENSITY=5): enforce asymmetric 12-column spans (col-span-8 + col-span-4), bold display hierarchy, interactive state machines, and zero repeated 3-card feature rows.",
        ["TasteSkill", "gpt-tasteskill", "Asymmetric Bento", "High Variance"],
    ),
    (
        "taste-redesign-audit",
        "TasteSkill Redesign — UI Slop Auditor & Hierarchy Refiner",
        "TasteSkill & Anti-Slop Art Direction",
        "Redesign sub-skill (redesign-skill) that audits existing DOM/CSS to strip AI tells, enforce tabular numerals, normalize spacing tokens, and upgrade visual hierarchy without breaking logic.",
        "Audit and upgrade existing UI structure: enforce font-variant-numeric: tabular-nums on all metrics/tables, normalize border tokens to 1px rgba(255,255,255,0.08), tighten heading tracking (-0.025em), and preserve 100% of existing event handlers.",
        ["TasteSkill", "redesign-skill", "UI Audit", "Refactor"],
    ),
]

BUILTIN_SKILLS: List[LLMSkill] = [
    _sk(sid, name, cat, desc, instr, tags)
    for (sid, name, cat, desc, instr, tags) in _RAW_SKILLS_SPEC
]


class SkillsRegistry:
    """
    Manages available LLM Skills for Local Dev Studio.
    - Includes 84 built-in specialized engineering, design, animation, AI, data, backend, security, cloud, and SaaS skills.
    - Automatically discovers all `SKILL.md` files installed in:
      1. `<workspace>/.agents/skills/*/SKILL.md`
      2. `~/.gemini/antigravity/builtin/skills/*/SKILL.md`
      3. `~/.gemini/config/plugins/*/skills/*/SKILL.md`
      4. `~/.gemini/skills/*/SKILL.md`
    - Total available skills: 100+ skills out of the box, plus user-created custom skills (`POST /api/skills`).
    """

    def __init__(self, skills_root: Optional[Path] = None) -> None:
        if skills_root is None:
            studio_root = Path(__file__).resolve().parents[3]
            skills_root = studio_root / ".agents" / "skills"
        self.skills_root = skills_root
        self.skills_root.mkdir(parents=True, exist_ok=True)

    def _external_skill_roots(self) -> List[Tuple[Path, str]]:
        home = Path.home()
        roots: List[Tuple[Path, str]] = [
            (self.skills_root, "Workspace Skill"),
            (self.skills_root.parent.parent.parent / ".agents" / "skills", "Workspace Skill"),
            (home / ".gemini" / "antigravity" / "builtin" / "skills", "Antigravity Builtin"),
            (home / ".gemini" / "skills", "Global Skill"),
        ]
        plugins_root = home / ".gemini" / "config" / "plugins"
        if plugins_root.exists():
            for plugin_dir in sorted(plugins_root.iterdir()):
                if plugin_dir.is_dir() and (plugin_dir / "skills").exists():
                    label = f"Plugin ({plugin_dir.name.title()})"
                    roots.append((plugin_dir / "skills", label))
        return roots

    def _parse_skill_md(
        self, skill_dir: Path, md_file: Path, default_category: str = "Agentic & Workflow Skills"
    ) -> Optional[LLMSkill]:
        try:
            raw = md_file.read_text(encoding="utf-8", errors="replace")
            skill_id = skill_dir.name
            name = skill_id.replace("-", " ").replace("_", " ").title()
            description = "Specialized LLM & Agent workflow skill loaded from SKILL.md"
            category = default_category
            instructions = raw.strip()

            fm_match = re.match(r"^---\s*\r?\n(.*?)\r?\n---\s*\r?\n(.*)$", raw, re.DOTALL)
            if fm_match:
                fm_text, body = fm_match.group(1), fm_match.group(2).strip()
                instructions = body or raw.strip()
                for line in fm_text.splitlines():
                    if ":" in line:
                        k, v = line.split(":", 1)
                        k = k.strip().lower()
                        v = v.strip().strip('"').strip("'")
                        if k == "name" and v:
                            name = v.replace("-", " ").replace("_", " ").title() if v.islower() else v
                        elif k == "description" and v:
                            description = v
                        elif k == "category" and v:
                            category = v

            return LLMSkill(
                id=skill_id,
                name=name,
                category=category,
                description=description[:260],
                instructions=instructions[:4000],
                tags=[category, "SKILL.md", skill_id],
                source="skill.md",
            )
        except Exception:
            return None

    def list_skills(self) -> List[LLMSkill]:
        by_id: Dict[str, LLMSkill] = {s.id: s for s in BUILTIN_SKILLS}

        for root_dir, default_cat in self._external_skill_roots():
            if not root_dir.exists():
                continue
            for child in sorted(root_dir.iterdir()):
                if not child.is_dir():
                    continue
                md_file = child / "SKILL.md"
                if md_file.exists():
                    parsed = self._parse_skill_md(child, md_file, default_category=default_cat)
                    if parsed and parsed.id not in by_id:
                        by_id[parsed.id] = parsed

        return list(by_id.values())

    def get_skills_by_ids(self, skill_ids: List[str]) -> List[LLMSkill]:
        if not skill_ids:
            return []
        catalog = {s.id: s for s in self.list_skills()}
        return [catalog[sid] for sid in skill_ids if sid in catalog]

    def create_skill(
        self,
        name: str,
        category: str,
        description: str,
        instructions: str,
        tags: Optional[List[str]] = None,
    ) -> LLMSkill:
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "custom-skill"
        target_dir = self.skills_root / slug
        target_dir.mkdir(parents=True, exist_ok=True)
        md_path = target_dir / "SKILL.md"

        md_content = (
            f"---\n"
            f"name: {name.strip()}\n"
            f"category: {category.strip() or 'Custom Skill'}\n"
            f"description: {description.strip()}\n"
            f"---\n\n"
            f"# {name.strip()}\n\n"
            f"{instructions.strip()}\n"
        )
        md_path.write_text(md_content, encoding="utf-8")

        return LLMSkill(
            id=slug,
            name=name.strip(),
            category=category.strip() or "Custom Skill",
            description=description.strip(),
            instructions=instructions.strip(),
            tags=tags or [category.strip() or "Custom", "SKILL.md"],
            source="custom",
        )

    def format_skills_for_prompt(self, skill_ids: List[str]) -> str:
        active = self.get_skills_by_ids(skill_ids)
        if not active:
            return "No additional specialized LLM skills selected."
        blocks: List[str] = []
        for idx, sk in enumerate(active, start=1):
            blocks.append(
                f"### SKILL {idx}: {sk.name} (`{sk.id}` — {sk.category})\n"
                f"- Summary: {sk.description}\n"
                f"- Mandatory Implementation Directives: {sk.instructions}"
            )
        return "\n\n".join(blocks)
