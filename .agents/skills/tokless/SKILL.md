---
name: tokless
category: Token Optimization & Context Compression
description: Tokless (Token-Less) high-density token optimization skill for all LLM agents and workspaces. Minimizes prompt/completion token waste by 40-70% via AST/symbol-first context pruning, zero-boilerplate code emission, prefix KV-cache alignment, and delta-only multi-turn updates.
---

# Tokless Skill: High-Efficiency Token Utilization (`tokless`)

## 1. Purpose & Core Philosophy
**Tokless** (`tokless`) enforces maximum information density per token across both **input context (prompt tokens)** and **generated output (completion tokens)**, reducing latency, memory footprint, and token usage by **40%–70%** without sacrificing code completeness or UI quality.

| Optimization Layer | Standard (High-Token Waste) | Tokless Protocol (40–70% Token Reduction) |
| :--- | :--- | :--- |
| **1. Input Context Pruning** | Dumping full unminified files, lockfiles, and verbose chat history into every turn. | Strip comments, SVG path blobs, base64 strings, and boilerplate before prompt assembly; include only active symbols, schema signatures, and modified regions. |
| **2. Prefix KV-Cache Reuse** | Mutating system prompts or reordering static instructions on every call. | Keep `system_prompt` + skill directives 100% static at the prefix so `llama.cpp` / `Ollama` / Cloud APIs reuse the KV-cache (`cache_prompt: true`) in 0ms. |
| **3. Completion Density** | Emitting verbose inline comments, redundant CSS rules, and repetitive HTML nodes. | Emit zero code comments, use Tailwind utility classes instead of custom CSS blocks, and render repeated UI cards/rows dynamically from a compact JS data array (`items.map(...)`). |
| **4. Multi-Turn Delta Context** | Re-sending entire multi-turn transcripts verbatim. | Summarize prior turns into a compact `<workspace_state>` manifest (active files, state keys, DOM IDs) and apply surgical diffs. |
| **5. Tool & File Read Discipline** | Reading entire 2,000-line files repeatedly. | Use targeted line ranges (`StartLine`/`EndLine`), `MEMORY.md` file maps, and batch parallel tool calls. |

---

## 2. Mandatory Directives for Code Synthesis & Agent Loops
1. **Zero Comment & Zero Boilerplate Emission**:
   - Do **not** emit `// ...` or `/* ... */` or `<!-- ... -->` comments in generated code unless explicitly requested.
   - Never emit placeholder stubs or redundant wrapper `<div>` layers.
2. **Data-Driven Loop Rendering Over Repetitive Markup**:
   - Never hardcode 6+ identical HTML cards, table rows, or nav items in raw markup.
   - Define a compact JSON/JS array (`const DATA = [...]`) and render via `.map(...).join('')` — cutting completion tokens by up to **65%** and making search/filter/CRUD automatic.
3. **Compact Tailwind & Token Reuse**:
   - Reuse shared utility classes or a single compact helper function (`const cls = ...`) rather than repeating 20-class strings across dozens of elements.
4. **Prompt Context Compression (Backend Agent)**:
   - Strip multi-line comments, excessive blank lines, and large inline SVG/base64 payloads from existing workspace files before injecting them into the LLM context window.
   - Cap historical prompt context to the most recent relevant state delta.
