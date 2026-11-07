---
name: CuriousLLM — Base-Engine Reasoning & Higher-LLM Local Server Skill
description: Base-application skill for VibeForge that enables the local LLM server (llama-server :8780 & Ollama :11434) to run higher-parameter LLMs (14B, 32B, DeepSeek-R1, QwQ, Qwen2.5-Coder-7B/14B/32B) via quantized KV-cache, Flash Attention, and mmap layer streaming, paired with an internal Curiosity-Driven Multi-Hop Reasoning Loop ([FOLLOW_UP_QUERY] -> [ENOUGH_EVIDENCE]).
---

# CuriousLLM — Base-Engine Reasoning & Higher-LLM Local Server Skill

> **Scope**: This skill operates strictly at the **VibeForge Base Application level** (`LocalLLMManager` and `CodingAgent`). It is an internal server-side reasoning and model-scaling engine for VibeForge itself, not a UI widget injected into user projects.

---

## 1. Purpose & Core Architecture

Running high-parameter coding and reasoning models (`14B`, `32B`, `DeepSeek-R1`, `QwQ`) on a local server (`llama.cpp` / `Ollama`) faces two bottlenecks:
1. **Memory Wall (VRAM / RAM OOM)**: Unquantized FP16 KV-caches and full-weight allocations cause Out-Of-Memory crashes when context windows grow beyond 4K–8K tokens.
2. **Single-Pass Reasoning Fragility**: Standard one-shot prompting forces a local model to guess missing architectural bridges, state transitions, and data schemas in a single forward pass.

**CuriousLLM** solves both inside VibeForge's backend engine:
- **Layer 1 — Hardware-Aware Higher-LLM Server Scaling (`LocalLLMManager`)**: Profiles host RAM, swap, and GPU memory to launch `llama-server` (`:8780`) and configure `Ollama` (`:11434`) with **8-bit/4-bit Quantized KV-Caches (`q8_0` / `q4_0`)**, **Flash Attention (`-fa`)**, and **Memory-Mapped Weight Streaming (`--mmap`)**, reducing memory overhead by 50–70% so higher-parameter models run smoothly on local servers.
- **Layer 2 — Curiosity-Driven Multi-Hop Reasoning Loop (`CodingAgent`)**: Before generating application code, the agent performs an internal **Curiosity Gap Probe** that decomposes the prompt into:
  1. `KNOWN_EVIDENCE`: Existing workspace files, DOM IDs, state structures, and explicit user requirements.
  2. `FOLLOW_UP_QUERIES`: Targeted bridging & comparison questions simulating human engineering curiosity (e.g., *"What state transitions connect the filter controls to the chart canvas?"*, *"Which existing functions must be preserved during this multi-turn update?"*).
  3. `RESOLVED_BRIDGES` → `[ENOUGH_EVIDENCE]`: Answers each follow-up question against the workspace AST and injects the compact reasoning brief into the LLM synthesis call.

---

## 2. Local Server Higher-LLM Scaling Rules (`LocalLLMManager`)

### 2.1 Model Tier Priority Ranking
When probing local endpoints (`:8780` `llama-server`, `:11434` `Ollama`, `:1234` `LM Studio`), `LocalLLMManager` prioritizes the highest available reasoning/coding model in this order:
1. **Tier 1 (32B Frontier Local)**: `qwen2.5-coder:32b`, `qwq:32b`, `deepseek-r1:32b`
2. **Tier 2 (14B High-Capacity Local)**: `qwen2.5-coder:14b`, `deepseek-r1:14b`
3. **Tier 3 (7B–8B Workhorse Local)**: `deepseek-r1:8b`, `deepseek-r1:7b`, `qwen2.5-coder:7b`
4. **Tier 4 (Fast Edge / Draft Local)**: `qwen2.5-coder:3b`, `qwen3.5:2b`, `qwen2.5-coder:1.5b`

### 2.2 `llama-server` Higher-LLM Memory Flags (`:8780`)
- **Flash Attention**: Always pass `-fa` (`--flash-attn`) when supported to accelerate long-context prefill and reduce attention memory footprint.
- **Quantized KV-Cache**:
  - Pass `-ctk q8_0 -ctv q8_0` by default (cuts KV-cache RAM by ~50% with zero perceptual quality loss).
  - Switch to `-ctk q4_0 -ctv q4_0` when loading 14B/32B models on hosts with `< 16 GB` physical RAM (or via `LOCAL_LLM_KV_QUANT=q4_0`).
- **Memory-Mapped Streaming**: Keep `--mmap` enabled so layers exceeding free physical RAM stream from NVMe swap without triggering OS OOM killers.

### 2.3 Reasoning Trace Extraction (`<think>...</think>`)
- Reasoning models (`DeepSeek-R1`, `QwQ`, `Qwen3`) emit internal chain-of-thought inside `<think>...</think>` blocks before outputting code.
- `LocalLLMManager.strip_reasoning_trace()` extracts and logs the `<think>` trace for server telemetry while returning the clean code payload to `DiffEngine`.

---

## 3. Curiosity-Driven Multi-Hop Reasoning Protocol (`CodingAgent`)

For every synthesis pass in `CodingAgent._generate_llm_patch_plan()`:
1. **Extract Workspace Evidence**: Inspect active workspace files (`index.html`, `app/page.tsx`) and chronological prompt history.
2. **Generate Curiosity Follow-Up Hops (`_curious_llm_decompose_prompt`)**:
   - **Hop 1 (Domain & Data Schema Bridge)**: Identify required datasets, metrics, or records and how they map to interactive UI controls.
   - **Hop 2 (State & Controller Bridge)**: Identify event listeners, filter/search/tab state transitions, and chart/table synchronization invariants.
   - **Hop 3 (Multi-Turn Continuity Bridge)**: Verify which existing components and DOM IDs in `index.html` must be preserved and extended.
3. **Emit `[ENOUGH_EVIDENCE]` Directive**: Append the resolved 3-hop reasoning brief to the synthesis prompt so the local LLM generates complete, self-consistent code in a single verified pass.
