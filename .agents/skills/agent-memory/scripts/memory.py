#!/usr/bin/env python3
"""CLI helper for managing per-project .agents/memory/ context files."""

import argparse
from datetime import datetime
from pathlib import Path


MEMORY_TEMPLATE = """# Project Memory: {project_name}

## 1. Project Identity & Tech Stack
- **Project Name**: {project_name}
- **Workspace Root**: `{workspace_path}`
- **Tech Stack**: (Update with backend, frontend, database, and key libraries)

## 2. Run & Verification Commands
- **Dev Server**: `(e.g. python -m uvicorn app.main:app --reload)`
- **Tests**: `(e.g. python -m pytest -v)`
- **Static Checks**: `(e.g. node --check ...)`

## 3. Core Domain Rules & Invariants
- Document non-negotiable domain rules, state machine invariants, and UI constraints here.

## 4. Key File Map
- List primary entrypoints, models, services, and UI files here.

## 5. Recent Decisions & Gotchas
- `[{today}]` Initialized `.agents/memory/MEMORY.md` for persistent cross-session context clarity.
"""

DECISIONS_HEADER = """# Architectural & Product Decisions Log

Chronological record of key design decisions, domain rule clarifications, and user preferences.

"""

FIXES_HEADER = """# Bugs, Root Causes & Regression Guards

Chronological record of non-obvious bugs resolved and the tests guarding against regressions.

"""


def get_memory_dir(workspace: str) -> Path:
    ws = Path(workspace).resolve()
    return ws / ".agents" / "memory"


def cmd_init(workspace: str, force: bool = False) -> None:
    ws = Path(workspace).resolve()
    mem_dir = get_memory_dir(workspace)
    mem_dir.mkdir(parents=True, exist_ok=True)
    today = datetime.now().strftime("%Y-%m-%d")

    mem_file = mem_dir / "MEMORY.md"
    if not mem_file.exists() or force:
        mem_file.write_text(
            MEMORY_TEMPLATE.format(
                project_name=ws.name,
                workspace_path=str(ws).replace("\\", "/"),
                today=today,
            ),
            encoding="utf-8",
        )

    dec_file = mem_dir / "decisions.md"
    if not dec_file.exists() or force:
        dec_file.write_text(DECISIONS_HEADER, encoding="utf-8")

    fix_file = mem_dir / "bugs-and-fixes.md"
    if not fix_file.exists() or force:
        fix_file.write_text(FIXES_HEADER, encoding="utf-8")

    print(f"Initialized agent-memory in: {mem_dir}")


def cmd_status(workspace: str) -> None:
    mem_dir = get_memory_dir(workspace)
    mem_file = mem_dir / "MEMORY.md"
    if not mem_file.exists():
        print(f"No MEMORY.md found at {mem_file}. Run 'init' first.")
        return
    print(mem_file.read_text(encoding="utf-8"))


def cmd_log_decision(workspace: str, title: str, summary: str) -> None:
    cmd_init(workspace, force=False)
    mem_dir = get_memory_dir(workspace)
    dec_file = mem_dir / "decisions.md"
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = f"## [{ts}] {title}\n- {summary}\n\n"
    with dec_file.open("a", encoding="utf-8") as f:
        f.write(entry)
    print(f"Logged decision to {dec_file}")


def cmd_log_fix(workspace: str, title: str, details: str) -> None:
    cmd_init(workspace, force=False)
    mem_dir = get_memory_dir(workspace)
    fix_file = mem_dir / "bugs-and-fixes.md"
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    entry = f"## [{ts}] {title}\n- {details}\n\n"
    with fix_file.open("a", encoding="utf-8") as f:
        f.write(entry)
    print(f"Logged fix to {fix_file}")


def cmd_sync_all(parent_root: str) -> None:
    root = Path(parent_root).resolve()
    skill_src = Path(__file__).resolve().parent.parent
    skill_md = (skill_src / "SKILL.md").read_text(encoding="utf-8")
    script_py = Path(__file__).resolve().read_text(encoding="utf-8")
    count = 0
    for child in sorted(root.iterdir()):
        if not child.is_dir() or child.name.startswith("."):
            continue
        target_skill = child / ".agents" / "skills" / "agent-memory"
        (target_skill / "scripts").mkdir(parents=True, exist_ok=True)
        (target_skill / "SKILL.md").write_text(skill_md, encoding="utf-8")
        (target_skill / "scripts" / "memory.py").write_text(script_py, encoding="utf-8")
        cmd_init(str(child), force=False)
        count += 1
    print(f"Synced agent-memory skill and initialized .agents/memory/ across {count} projects in {root}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent Memory CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    p_init = sub.add_parser("init", help="Initialize .agents/memory/ in workspace")
    p_init.add_argument("--workspace", default=".", help="Workspace root directory")
    p_init.add_argument("--force", action="store_true", help="Overwrite existing templates")

    p_status = sub.add_parser("status", help="Show current MEMORY.md")
    p_status.add_argument("--workspace", default=".", help="Workspace root directory")

    p_dec = sub.add_parser("log-decision", help="Append a decision to decisions.md")
    p_dec.add_argument("title", help="Short decision title")
    p_dec.add_argument("summary", help="Decision details and impact")
    p_dec.add_argument("--workspace", default=".", help="Workspace root directory")

    p_fix = sub.add_parser("log-fix", help="Append a bug fix to bugs-and-fixes.md")
    p_fix.add_argument("title", help="Short bug/fix title")
    p_fix.add_argument("details", help="Root cause, fix, and test guard")
    p_fix.add_argument("--workspace", default=".", help="Workspace root directory")

    p_sync = sub.add_parser("sync-all", help="Sync agent-memory skill and init memory across all projects in directory")
    p_sync.add_argument("--root", default="..", help="Parent directory containing projects")

    args = parser.parse_args()
    if args.command == "init":
        cmd_init(args.workspace, args.force)
    elif args.command == "status":
        cmd_status(args.workspace)
    elif args.command == "log-decision":
        cmd_log_decision(args.workspace, args.title, args.summary)
    elif args.command == "log-fix":
        cmd_log_fix(args.workspace, args.title, args.details)
    elif args.command == "sync-all":
        cmd_sync_all(args.root)


if __name__ == "__main__":
    main()
