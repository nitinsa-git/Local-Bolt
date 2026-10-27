# Antigravity Autonomous Execution Directives

1. EXECUTION PARADIGM:
   - You have native shell and file-system write access. Never ask the user to create files or run commands manually. Execute them directly.
   - Run sub-commands using non-interactive flags (e.g., `npm install -y`, `apt-get install -y -q`).
   - After writing or modifying code, immediately execute syntax, type, and lint checks (`tsc --noEmit`, `ruff check .`, `pytest`). If a check fails, self-heal without pausing.

2. ARCHITECTURAL BOUNDARIES:
   - Backend: Modular FastAPI with Pydantic v2 validation and structured logging.
   - Frontend: Next.js 15 (App Router), Tailwind CSS, Lucide icons, Shadcn UI primitives, and React Query/Zustand for state.
   - Infrastructure: Docker Compose with health checks on every container.

3. VERIFICATION GATES:
   - Every completed phase must be verified via curl/API tests and headless browser evaluation before proceeding to the next phase.
