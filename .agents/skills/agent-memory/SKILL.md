---
name: agent-memory
description: >-
  Persistent project memory and context clarity system (.agents/memory/). Use at the start of any conversation or task to load project architecture, domain invariants, and past decisions, and after completing features, bugfixes, or refactors to persist updated context across all projects.
---

# Agent Memory (`agent-memory`)

Maintain a high-signal, persistent memory bank inside `.agents/memory/` at the root of each project workspace so context remains crystal clear across long conversations, context compactions, and future sessions.

## Memory Directory Structure

Each project stores its memory bank in `.agents/memory/`:

```text
<workspace-root>/.agents/memory/
├── MEMORY.md           # Primary high-signal index (< 150 lines) — ALWAYS read first
├── decisions.md        # Chronological architectural & domain decision log
└── bugs-and-fixes.md   # Non-obvious root causes, edge cases & regression guards
```

## Workflow

### 1. Load Context at Task Start
1. Check if `.agents/memory/MEMORY.md` exists in the active workspace.
2. If it exists, view `.agents/memory/MEMORY.md` before exploring the codebase from scratch.
3. If it does not exist, initialize it with:
   ```powershell
   python ".agents/skills/agent-memory/scripts/memory.py" init --workspace .
   ```
   Then populate `MEMORY.md` with the discovered stack, commands, domain invariants, and file map.

### 2. Persist Context After Code or Domain Changes
Before concluding a task that alters behavior, adds features, fixes a bug, or establishes a user preference:
1. **Update `.agents/memory/MEMORY.md`**:
   - Ensure **Core Domain Rules & Invariants** reflects any new business logic (e.g., status filters, capacity rules, UI constraints).
   - Ensure **Key File Map** includes any newly created files or endpoints.
   - Add a 1-line summary under **Recent Decisions & Gotchas**.
2. **Log Detailed Decisions or Bug Fixes**:
   - Record architectural/product choices:
     ```powershell
     python ".agents/skills/agent-memory/scripts/memory.py" log-decision "Title" "Rationale and impact" --workspace .
     ```
   - Record bug root causes and regression tests:
     ```powershell
     python ".agents/skills/agent-memory/scripts/memory.py" log-fix "Title" "Root cause, fix location, and test guard" --workspace .
     ```
